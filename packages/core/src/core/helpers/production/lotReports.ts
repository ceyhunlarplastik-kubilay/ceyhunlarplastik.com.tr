/**
 * Vardiya RAPORU (lot bazında saha girişi) — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 * Operatör hesabı yok: raporu planlayıcı, genellikle vardiya sonunda ya da ertesi gün girer.
 *  - Lot başlatma (isteğe bağlı, anlık izleme): yalnız sahaya verilmiş iş; işte aynı anda tek
 *    lot üretimde. Başlatma işi Üretimde'ye geçirir (duraklatılmış işi de sürdürür).
 *  - Rapor: başlangıç / bitiş, çıktı başına sağlam + fire (+ fire nedeni kırılımı), duruşlar
 *    (neden + dakika), opsiyonel baskı sayısı. Rapor lotu kapatır; sıradaki lot kendiliğinden
 *    başlar (başlangıcı bu lotun bitişi). İş tamamlanana kadar rapor düzeltilebilir.
 *  - Baskı: girilmediyse adetlerden (en büyük (sağlam + fire) / göz). Kalıp sayacı rapordan
 *    artar (düzeltmede fark kadar); raporsuz lotlarla tamamlanan işte eksik baskı tamamlamada eklenir.
 */
import { MAX_OUTPUT_QUANTITY, ON_FLOOR_JOB_STATUSES, type ProductionJobStatus } from "./jobStateMachine"
import type { ProductionReasonKind } from "./productionReasons"

export const LOT_STARTABLE_JOB_STATUSES: ProductionJobStatus[] = ON_FLOOR_JOB_STATUSES

/** Bir lotun (vardiyanın) gerçekleşen süresi en fazla — fazla mesai payıyla. */
export const MAX_LOT_DURATION_MINUTES = 30 * 60
/** Saat farkı / girişteki gecikmeye tolerans: bitiş "şimdi"den en çok bu kadar ileride olabilir. */
const FUTURE_TOLERANCE_MS = 5 * 60_000

export type LotExecutionStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "CANCELLED"

/** İş durumu — lotu raporlanabilir / başlatılabilir kılan ortak koşul. */
function jobIssue(jobStatus: ProductionJobStatus): string | null {
    if (jobStatus === "PLANNED") return "İş henüz sahaya verilmedi; önce Durum Panosu'nda sahaya verin."
    if (jobStatus === "COMPLETED" || jobStatus === "CANCELLED") return "İş kapanmış; lot raporu değiştirilemez."
    return null
}

export function findLotStartIssue(input: {
    jobStatus: ProductionJobStatus
    lotStatus: LotExecutionStatus
    /** İşte şu an üretimde olan BAŞKA lotun numarası ("1000-1"); yoksa `null`. */
    runningLotNumber: string | null
}): string | null {
    const issue = jobIssue(input.jobStatus)
    if (issue) return issue
    if (input.lotStatus !== "PLANNED") return "Lot zaten başlamış ya da kapanmış."
    if (input.runningLotNumber) return `${input.runningLotNumber} hâlâ üretimde; önce onun raporunu girin.`
    return null
}

/** Lot başlayınca iş Üretimde'ye geçer (sahaya verildi / bağlanıyor / duraklatıldı). */
export function jobStatusAfterLotStart(jobStatus: ProductionJobStatus): ProductionJobStatus {
    return jobStatus === "RELEASED" || jobStatus === "SETUP" || jobStatus === "PAUSED" ? "RUNNING" : jobStatus
}

/**
 * Rapor, üretimin yapıldığını gösterir: sahaya verilmiş / bağlanan iş Üretimde'ye geçer.
 * Duraklatılmış iş duraklatılmış kalır (rapor geçmiş bir vardiyaya ait olabilir).
 */
export function jobStatusAfterReport(jobStatus: ProductionJobStatus): ProductionJobStatus {
    return jobStatus === "RELEASED" || jobStatus === "SETUP" ? "RUNNING" : jobStatus
}

export type LotReportInput = {
    actualStartAt: Date
    actualEndAt: Date
    actualShots: number | null
    outputs: Array<{
        jobOutputId: string
        goodQuantity: number
        scrapQuantity: number
        scrapReasons: Array<{ reasonId: string; quantity: number }>
    }>
    stops: Array<{ reasonId: string; durationMinutes: number; startAt: Date | null }>
}

export type LotReportIssue = { field: string; message: string }

const isCount = (value: number) => Number.isInteger(value) && value >= 0 && value <= MAX_OUTPUT_QUANTITY

/**
 * Rapor kuralları (form ve Lambda aynı fonksiyonu çağırır). `reasons`: sözlük; `keptReasonIds`:
 * mevcut raporda zaten kullanılan nedenler (sonradan pasife alınmış olsalar da kalabilir).
 */
export function findLotReportIssues(input: {
    report: LotReportInput
    jobOutputIds: string[]
    jobStatus: ProductionJobStatus
    reasons: Array<{ id: string; kind: ProductionReasonKind; isActive: boolean }>
    keptReasonIds: string[]
    now: Date
}): LotReportIssue[] {
    const issues: LotReportIssue[] = []
    const status = jobIssue(input.jobStatus)
    if (status) return [{ field: "job", message: status }]

    const { report } = input
    const startMs = report.actualStartAt.getTime()
    const endMs = report.actualEndAt.getTime()
    const durationMinutes = (endMs - startMs) / 60_000
    if (!(endMs > startMs)) issues.push({ field: "actualEndAt", message: "Bitiş başlangıçtan sonra olmalı." })
    else if (durationMinutes > MAX_LOT_DURATION_MINUTES) issues.push({ field: "actualEndAt", message: `Lot süresi ${MAX_LOT_DURATION_MINUTES / 60} saati aşamaz.` })
    if (endMs > input.now.getTime() + FUTURE_TOLERANCE_MS) issues.push({ field: "actualEndAt", message: "Bitiş gelecekte olamaz." })

    if (report.actualShots !== null && !isCount(report.actualShots)) {
        issues.push({ field: "actualShots", message: "Baskı sayısı 0 ya da pozitif tam sayı olmalı." })
    }

    const reasonById = new Map(input.reasons.map((reason) => [reason.id, reason]))
    const reasonIssue = (reasonId: string, kind: ProductionReasonKind): string | null => {
        const reason = reasonById.get(reasonId)
        if (!reason || reason.kind !== kind) return kind === "STOP" ? "Duruş nedeni bulunamadı." : "Fire nedeni bulunamadı."
        if (!reason.isActive && !input.keptReasonIds.includes(reasonId)) return "Pasif neden yeni raporda seçilemez."
        return null
    }

    const seen = new Set<string>()
    report.outputs.forEach((output, index) => {
        const field = `outputs.${index}`
        if (!input.jobOutputIds.includes(output.jobOutputId)) {
            issues.push({ field, message: "Bu çıktı işe ait değil." })
            return
        }
        if (seen.has(output.jobOutputId)) issues.push({ field, message: "Aynı çıktı iki kez girilmiş." })
        seen.add(output.jobOutputId)
        if (!isCount(output.goodQuantity)) issues.push({ field: `${field}.goodQuantity`, message: "Sağlam adet 0 ya da pozitif tam sayı olmalı." })
        if (!isCount(output.scrapQuantity)) issues.push({ field: `${field}.scrapQuantity`, message: "Fire adedi 0 ya da pozitif tam sayı olmalı." })

        const reasonIds = new Set<string>()
        let reasonTotal = 0
        output.scrapReasons.forEach((entry, reasonIndex) => {
            const reasonField = `${field}.scrapReasons.${reasonIndex}`
            const issue = reasonIssue(entry.reasonId, "SCRAP")
            if (issue) issues.push({ field: reasonField, message: issue })
            if (reasonIds.has(entry.reasonId)) issues.push({ field: reasonField, message: "Aynı fire nedeni iki kez girilmiş." })
            reasonIds.add(entry.reasonId)
            if (!Number.isInteger(entry.quantity) || entry.quantity < 1) issues.push({ field: reasonField, message: "Neden adedi pozitif tam sayı olmalı." })
            reasonTotal += entry.quantity
        })
        if (reasonTotal > output.scrapQuantity) {
            issues.push({ field: `${field}.scrapQuantity`, message: `Fire nedenlerinin toplamı (${reasonTotal}) fireyi (${output.scrapQuantity}) aşamaz.` })
        }
    })
    if (input.jobOutputIds.some((id) => !seen.has(id))) issues.push({ field: "outputs", message: "Her çıktının sağlam ve fire adedi girilmeli." })

    let stopMinutes = 0
    report.stops.forEach((stop, index) => {
        const field = `stops.${index}`
        const issue = reasonIssue(stop.reasonId, "STOP")
        if (issue) issues.push({ field: `${field}.reasonId`, message: issue })
        if (!Number.isInteger(stop.durationMinutes) || stop.durationMinutes < 1) {
            issues.push({ field: `${field}.durationMinutes`, message: "Duruş süresi en az 1 dakika olmalı." })
        }
        stopMinutes += stop.durationMinutes
        if (stop.startAt) {
            const stopStart = stop.startAt.getTime()
            if (stopStart < startMs || stopStart + stop.durationMinutes * 60_000 > endMs) {
                issues.push({ field: `${field}.startAt`, message: "Duruş lotun başlangıç–bitiş aralığında olmalı." })
            }
        }
    })
    if (endMs > startMs && stopMinutes > durationMinutes) {
        issues.push({ field: "stops", message: `Duruşların toplamı (${stopMinutes} dk) lot süresini (${Math.round(durationMinutes)} dk) aşamaz.` })
    }
    return issues
}

/** Baskı: girildiyse o; değilse en büyük ⌈(sağlam + fire) / göz⌉ (gözü kapatılmış çıktı hariç). */
export function deriveShots(input: { actualShots: number | null; outputs: Array<{ goodQuantity: number; scrapQuantity: number; cavities: number }> }): number {
    if (input.actualShots !== null) return input.actualShots
    return input.outputs.reduce((max, output) => (
        output.cavities > 0 ? Math.max(max, Math.ceil((output.goodQuantity + output.scrapQuantity) / output.cavities)) : max
    ), 0)
}

/** Tamamlanan işte raporsuz kalan baskı: iş toplamından çıkan baskı − raporlanan lotların baskısı. */
export function unreportedJobShots(input: { outputs: Array<{ goodQuantity: number; scrapQuantity: number; cavities: number }>; reportedShots: number }): number {
    return Math.max(0, deriveShots({ actualShots: null, outputs: input.outputs }) - input.reportedShots)
}

/** Raporlanan lotun ardından kendiliğinden başlayacak lot: sıradaki ve hâlâ planlı olan. */
export function nextLotToStart<T extends { sequence: number; status: LotExecutionStatus }>(lots: T[], reportedSequence: number): T | null {
    return lots.find((lot) => lot.sequence === reportedSequence + 1 && lot.status === "PLANNED") ?? null
}

/** Raporlanan lotların çıktı toplamı (pano tamamlama dialog'unun önerisi). */
export function sumReportedOutputs(lots: Array<{ reported: boolean; outputs: Array<{ jobOutputId: string; goodQuantity: number; scrapQuantity: number }> }>) {
    const totals = new Map<string, { goodQuantity: number; scrapQuantity: number }>()
    for (const lot of lots) {
        if (!lot.reported) continue
        for (const output of lot.outputs) {
            const current = totals.get(output.jobOutputId) ?? { goodQuantity: 0, scrapQuantity: 0 }
            totals.set(output.jobOutputId, {
                goodQuantity: current.goodQuantity + output.goodQuantity,
                scrapQuantity: current.scrapQuantity + output.scrapQuantity,
            })
        }
    }
    return totals
}
