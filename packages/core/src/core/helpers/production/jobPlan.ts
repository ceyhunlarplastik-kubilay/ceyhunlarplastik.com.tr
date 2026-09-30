/**
 * Seçilen aday planı yazılacak kayıtlara çevirir — SAF modül. Kimlikler dışarıdan üretilir
 * (`newId`) ki iş + çıktılar + lotlar + lot çıktıları TEK dizi transaction'ında, etkileşimli
 * transaction ve ara okuma olmadan yazılabilsin (Neon P2028 dersi, CLAUDE.md).
 *
 *  - Aile kalıbında kalıbın TÜM göz grupları üretilir: emrin ölçüsü emre bağlanır, diğerleri
 *    yan üründür (stok, `productionOrderId = null`).
 *  - Adet = baskı × göz (brüt; fire sahada sayılır).
 *  - Lot numarası saklanmaz: "kök-sıra" (`lotBaseNumber`-`sequence`).
 */
import type { OrderCandidate } from "./orderCandidates"

export type JobPlanInput = {
    candidate: Pick<
        OrderCandidate,
        "machine" | "mold" | "shots" | "cycleTimeSec" | "setupMinutes" | "setupStartAt" | "productionStartAt" | "endAt" | "lots"
    >
    efficiencyPercent: number
    moldOutputs: Array<{ id: string; productSizeId: string; cavities: number }>
    order: { id: string; productSizeId: string }
    versionSignature: string
    createdByUserId: string | null
    newId: () => string
}

export type JobPlanWrite = {
    job: {
        id: string
        machineId: string
        moldId: string
        versionSignature: string
        plannedShots: number
        setupStartAt: Date
        productionStartAt: Date
        plannedEndAt: Date
        cycleTimeSec: number
        efficiencyPercent: number
        setupMinutes: number
        createdByUserId: string | null
    }
    outputs: Array<{
        id: string
        jobId: string
        moldOutputId: string
        productSizeId: string
        productionOrderId: string | null
        cavities: number
        plannedQuantity: number
    }>
    lots: Array<{
        id: string
        jobId: string
        sequence: number
        /** "YYYY-MM-DD" (vardiya günü) */
        shiftDate: string
        shiftCode: string
        plannedStartAt: Date
        plannedEndAt: Date
        plannedShots: number
    }>
    lotOutputs: Array<{ id: string; lotId: string; jobOutputId: string; plannedQuantity: number }>
}

export function buildJobPlan(input: JobPlanInput): JobPlanWrite {
    const { candidate } = input
    if (!candidate.setupStartAt || !candidate.productionStartAt || !candidate.endAt) {
        throw new Error("Takvime yerleşmemiş aday işe çevrilemez.")
    }

    const jobId = input.newId()
    const outputs = input.moldOutputs
        .filter((output) => output.cavities > 0)
        .map((output) => ({
            id: input.newId(),
            jobId,
            moldOutputId: output.id,
            productSizeId: output.productSizeId,
            productionOrderId: output.productSizeId === input.order.productSizeId ? input.order.id : null,
            cavities: output.cavities,
            plannedQuantity: candidate.shots * output.cavities,
        }))

    const lots = candidate.lots.map((lot) => ({
        id: input.newId(),
        jobId,
        sequence: lot.sequence,
        shiftDate: lot.workday,
        shiftCode: lot.shiftCode,
        plannedStartAt: lot.startAt,
        plannedEndAt: lot.endAt,
        plannedShots: lot.shots,
    }))

    const lotOutputs = lots.flatMap((lot) => outputs.map((output) => ({
        id: input.newId(),
        lotId: lot.id,
        jobOutputId: output.id,
        plannedQuantity: lot.plannedShots * output.cavities,
    })))

    return {
        job: {
            id: jobId,
            machineId: candidate.machine.id,
            moldId: candidate.mold.id,
            versionSignature: input.versionSignature,
            plannedShots: candidate.shots,
            setupStartAt: candidate.setupStartAt,
            productionStartAt: candidate.productionStartAt,
            plannedEndAt: candidate.endAt,
            cycleTimeSec: candidate.cycleTimeSec,
            efficiencyPercent: input.efficiencyPercent,
            setupMinutes: candidate.setupMinutes,
            createdByUserId: input.createdByUserId,
        },
        outputs,
        lots,
        lotOutputs,
    }
}

/** Taşımadan önce işin mevcut lotu — kalıcı kayıtları (not, lota özel ekip) sayılarıyla. */
export type ExistingJobLot = { id: string; sequence: number; noteCount: number; lotOperatorCount: number }

type LotSchedule = Pick<JobPlanWrite["lots"][number], "shiftDate" | "shiftCode" | "plannedStartAt" | "plannedEndAt" | "plannedShots">

/**
 * Taşıma yazımı: işin kimliği ve çıktıları korunur; lotlar SIRA numarasına göre yerinde
 * güncellenir — "1000-2" taşımadan sonra da aynı kayıttır, notu ve ekibi onunla kalır.
 */
export type JobRescheduleWrite = {
    job: Omit<JobPlanWrite["job"], "id" | "moldId" | "versionSignature" | "createdByUserId">
    /** Sırası yeni planda da olan lotlar: aynı kimlikle yeni vardiya / zaman / baskı. */
    lotUpdates: Array<{ id: string } & LotSchedule>
    /** Plan uzadıysa eklenen sıralar. */
    lotCreates: JobPlanWrite["lots"]
    /** Plan kısaldıysa kalkan sıralar. */
    lotDeleteIds: string[]
    /** Tüm lotların çıktı satırları baştan (planlı işte sayım yok); lot kimlikleri eşlenmiş. */
    lotOutputs: JobPlanWrite["lotOutputs"]
    outputQuantities: Array<{ id: string; plannedQuantity: number }>
    /**
     * Kalkacak ama notu ya da lota özel ekibi olan lotların sıraları. Boş değilse çağıran
     * YAZMADAN durmalı (409) — bu kayıtlar sessizce silinmesin.
     */
    blockedLotSequences: number[]
}

/**
 * Yeni planı (aynı kalıp, yeni makine / zaman) MEVCUT işe uygular — SAF. Çıktılar kalıp gözüne
 * göre eşlenir ve yerinde kalır (kalıp değişmediği için göz kümesi aynıdır; eşleşmeyen göz veri
 * tutarsızlığıdır ve hata fırlatır). Lotlar sıraya göre: ortak sıralar güncellenir, fazlası
 * eklenir ya da silinir.
 */
export function buildJobRescheduleWrite(
    plan: JobPlanWrite,
    existing: { jobId: string; outputs: Array<{ id: string; moldOutputId: string }>; lots: ExistingJobLot[] },
): JobRescheduleWrite {
    const existingByMoldOutput = new Map(existing.outputs.map((output) => [output.moldOutputId, output.id]))
    const outputIdMap = new Map<string, string>()
    for (const output of plan.outputs) {
        const existingId = existingByMoldOutput.get(output.moldOutputId)
        if (!existingId) throw new Error(`İşin çıktıları kalıbın gözleriyle eşleşmiyor (${output.moldOutputId}).`)
        outputIdMap.set(output.id, existingId)
    }

    const existingBySequence = new Map(existing.lots.map((lot) => [lot.sequence, lot]))
    const plannedSequences = new Set(plan.lots.map((lot) => lot.sequence))
    const lotIdMap = new Map<string, string>()
    const lotUpdates: JobRescheduleWrite["lotUpdates"] = []
    const lotCreates: JobRescheduleWrite["lotCreates"] = []

    for (const lot of plan.lots) {
        const kept = existingBySequence.get(lot.sequence)
        const schedule: LotSchedule = {
            shiftDate: lot.shiftDate,
            shiftCode: lot.shiftCode,
            plannedStartAt: lot.plannedStartAt,
            plannedEndAt: lot.plannedEndAt,
            plannedShots: lot.plannedShots,
        }
        if (kept) {
            lotIdMap.set(lot.id, kept.id)
            lotUpdates.push({ id: kept.id, ...schedule })
        } else {
            lotIdMap.set(lot.id, lot.id)
            lotCreates.push({ ...lot, jobId: existing.jobId })
        }
    }

    const removed = existing.lots.filter((lot) => !plannedSequences.has(lot.sequence))
    const { id: _id, moldId: _moldId, versionSignature: _signature, createdByUserId: _createdBy, ...job } = plan.job
    return {
        job,
        lotUpdates,
        lotCreates,
        lotDeleteIds: removed.map((lot) => lot.id),
        lotOutputs: plan.lotOutputs.map((lotOutput) => ({
            ...lotOutput,
            lotId: lotIdMap.get(lotOutput.lotId) as string,
            jobOutputId: outputIdMap.get(lotOutput.jobOutputId) as string,
        })),
        outputQuantities: plan.outputs.map((output) => ({
            id: outputIdMap.get(output.id) as string,
            plannedQuantity: output.plannedQuantity,
        })),
        blockedLotSequences: removed
            .filter((lot) => lot.noteCount > 0 || lot.lotOperatorCount > 0)
            .map((lot) => lot.sequence)
            .sort((a, b) => a - b),
    }
}

/** "1000-2" */
export function formatLotNumber(lotBaseNumber: number, sequence: number): string {
    return `${lotBaseNumber}-${sequence}`
}
