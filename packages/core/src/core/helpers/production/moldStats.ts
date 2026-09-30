/**
 * Kalıp istatistikleri ve gerçekleşen çevrim önerisi (Faz 5.3) — SAF modül (yalnız göreli import;
 * frontend de okuyabilir).
 *
 * - Gerçek çevrim 5.1 / 5.2 ile AYNI kuralla: pencerede BAŞLAYAN raporlu vardiyalarda
 *   (lot süresi − kayıtlı duruş) ÷ baskı. Duruşlar planda makine verimiyle karşılandığı için
 *   gerçek çevrime girmez (verimle iki kez sayılmasın).
 * - Kalıp satırı + kalıp × makine (karttaki çevrimle karşılaştırma, öneri) + kalıp × versiyon
 *   (renk / hammaddenin hıza etkisi) kırılımı.
 * - Öneri (kullanıcı onayı, 2026-09-28): o makinede en az 3 raporlu vardiya ve gerçek çevrim
 *   karttakinden (kart yoksa planların varsaydığından) en az %5 farklı. Otomatik yazılmaz;
 *   planlayıcı "Karta uygula" ile makine kartına yazar, sonraki planlar onu kullanır.
 * - Bakım: güncel durum + açık işlerin kalan baskısıyla öngörü (uyarı taramasıyla aynı sayı).
 */
import { remainingJobShots } from "./jobForecast"
import { isMaintenanceAlert, moldMaintenanceStatus, type MoldMaintenanceStatus } from "./moldMaintenance"

/** Varsayılan pencere: son 90 gün (bugün dahil) — öneri yakın geçmişe dayansın. */
export const MOLD_STATS_DEFAULT_RANGE_DAYS = 90
export const CYCLE_SUGGESTION_MIN_LOTS = 3
export const CYCLE_SUGGESTION_MIN_DEVIATION = 0.05
/** Kart çevrimi sınırı — kalıp formundaki kartla aynı (0 < sn ≤ 3600). */
export const MAX_CARD_CYCLE_SEC = 3600

export type MoldStatus = "ACTIVE" | "IN_MAINTENANCE" | "BROKEN" | "RETIRED"

export type MoldStatsLotInput = {
    moldId: string
    machineId: string
    machineCode: string
    versionSignature: string
    /** İşin planlama anındaki çevrimi (sn). */
    plannedCycleSec: number
    actualStartAt: Date
    actualEndAt: Date
    actualShots: number | null
    /** Lottaki kayıtlı duruşların toplamı (dk). */
    stopMinutes: number
    goodQuantity: number
    scrapQuantity: number
}

export type MoldStatsMoldInput = {
    id: string
    code: string
    name: string
    status: MoldStatus
    standardCycleTimeSec: number
    totalShots: number
    maintenanceIntervalShots: number | null
    shotsAtLastMaintenance: number
    lastMaintenanceAt: Date | null
    machineProfiles: Array<{ machineId: string; machineCode: string; cycleTimeSec: number | null }>
}

/** Açık (tamamlanmamış) iş: planlanan ve raporlanan baskı — bakım öngörüsü için. */
export type OpenJobShotsInput = { moldId: string; plannedShots: number; reportedShots: number }

export type CycleTotals = {
    reportedLotCount: number
    shots: number
    runMinutes: number
    goodQuantity: number
    scrapQuantity: number
    /** Raporlu vardiyalardan; baskı yoksa `null`. */
    actualCycleSec: number | null
    /** Planların varsaydığı çevrim, baskı ağırlıklı; baskı yoksa `null`. */
    plannedCycleSec: number | null
    /** Gerçek ÷ plan − 1. */
    deviation: number | null
}

export type CycleSuggestion = {
    cycleTimeSec: number
    /** Karşılaştırılan değer: karttaki çevrim, kart (ya da değeri) yoksa planların varsaydığı. */
    referenceSec: number
    referenceSource: "card" | "plan"
    /** Gerçek ÷ referans − 1. */
    deviation: number
}

export type MoldMachineCycleStats = CycleTotals & {
    machineId: string
    machineCode: string
    hasCard: boolean
    cardCycleSec: number | null
    suggestion: CycleSuggestion | null
}

export type MoldVersionCycleStats = CycleTotals & { versionSignature: string }

export type MoldStatsRow = CycleTotals & {
    moldId: string
    code: string
    name: string
    status: MoldStatus
    standardCycleTimeSec: number
    totalShots: number
    lastMaintenanceAt: Date | null
    maintenance: MoldMaintenanceStatus
    /** Açık işlerin henüz basılmamış baskısı. */
    shotsAhead: number
    scrapRate: number | null
    machines: MoldMachineCycleStats[]
    versions: MoldVersionCycleStats[]
    suggestionCount: number
}

export type MoldStatsSummary = {
    moldCount: number
    /** Pencerede raporlu vardiyası olan kalıp. */
    usedMoldCount: number
    reportedLotCount: number
    shots: number
    goodQuantity: number
    scrapQuantity: number
    scrapRate: number | null
    /** Bakım uyarısı olan (yaklaşan / gelen / planlı işlerle aşılacak) kalıp. */
    maintenanceAlertCount: number
    suggestionCount: number
}

const MINUTE_MS = 60_000

type Accumulator = {
    reportedLotCount: number
    shots: number
    runMinutes: number
    plannedCycleShotSec: number
    goodQuantity: number
    scrapQuantity: number
}

function emptyAccumulator(): Accumulator {
    return { reportedLotCount: 0, shots: 0, runMinutes: 0, plannedCycleShotSec: 0, goodQuantity: 0, scrapQuantity: 0 }
}

function addLot(target: Accumulator, lot: MoldStatsLotInput) {
    const gross = Math.max(0, (lot.actualEndAt.getTime() - lot.actualStartAt.getTime()) / MINUTE_MS)
    const shots = Math.max(0, lot.actualShots ?? 0)
    target.reportedLotCount += 1
    target.runMinutes += gross - Math.min(Math.max(0, lot.stopMinutes), gross)
    target.shots += shots
    target.plannedCycleShotSec += lot.plannedCycleSec * shots
    target.goodQuantity += lot.goodQuantity
    target.scrapQuantity += lot.scrapQuantity
}

function toTotals(accumulator: Accumulator): CycleTotals {
    const { plannedCycleShotSec, ...rest } = accumulator
    const actualCycleSec = accumulator.shots > 0 && accumulator.runMinutes > 0 ? (accumulator.runMinutes * 60) / accumulator.shots : null
    const plannedCycleSec = accumulator.shots > 0 ? plannedCycleShotSec / accumulator.shots : null
    return {
        ...rest,
        actualCycleSec,
        plannedCycleSec,
        deviation: actualCycleSec !== null && plannedCycleSec !== null && plannedCycleSec > 0 ? actualCycleSec / plannedCycleSec - 1 : null,
    }
}

function scrapRate(good: number, scrap: number): number | null {
    return good + scrap > 0 ? scrap / (good + scrap) : null
}

/** Karta 0,1 sn hassasiyetle yazılır. */
export function roundCycleSec(seconds: number): number {
    return Math.round(seconds * 10) / 10
}

/**
 * Çevrim önerisi: yeterli veri (en az 3 raporlu vardiya) ve karttakinden (kart yoksa planların
 * varsaydığından) en az %5 fark. Önerilen değer karttakiyle aynıya yuvarlanıyorsa öneri yok.
 */
export function cycleSuggestion(input: {
    actualCycleSec: number | null
    reportedLotCount: number
    cardCycleSec: number | null
    plannedCycleSec: number | null
}): CycleSuggestion | null {
    const { actualCycleSec, cardCycleSec } = input
    if (actualCycleSec === null || input.reportedLotCount < CYCLE_SUGGESTION_MIN_LOTS) return null
    const referenceSource = cardCycleSec !== null && cardCycleSec > 0 ? "card" : "plan"
    const referenceSec = referenceSource === "card" ? cardCycleSec : input.plannedCycleSec
    if (referenceSec === null || referenceSec <= 0) return null
    const deviation = actualCycleSec / referenceSec - 1
    if (Math.abs(deviation) < CYCLE_SUGGESTION_MIN_DEVIATION) return null
    const suggested = roundCycleSec(actualCycleSec)
    if (suggested <= 0 || suggested > MAX_CARD_CYCLE_SEC) return null
    if (cardCycleSec !== null && suggested === roundCycleSec(cardCycleSec)) return null
    return { cycleTimeSec: suggested, referenceSec, referenceSource, deviation }
}

export function buildMoldStats(input: {
    molds: MoldStatsMoldInput[]
    /** Pencerede BAŞLAYAN raporlu vardiyalar. */
    lots: MoldStatsLotInput[]
    openJobs: OpenJobShotsInput[]
}): { rows: MoldStatsRow[]; summary: MoldStatsSummary } {
    const lotsByMold = new Map<string, MoldStatsLotInput[]>()
    for (const lot of input.lots) lotsByMold.set(lot.moldId, [...(lotsByMold.get(lot.moldId) ?? []), lot])
    const shotsAhead = new Map<string, number>()
    for (const job of input.openJobs) {
        shotsAhead.set(job.moldId, (shotsAhead.get(job.moldId) ?? 0) + remainingJobShots(job.plannedShots, job.reportedShots))
    }

    const rows: MoldStatsRow[] = []
    for (const mold of input.molds) {
        const lots = lotsByMold.get(mold.id) ?? []
        // Kullanım dışı kalıp yalnız pencerede üretimi varsa listelenir.
        if (mold.status === "RETIRED" && lots.length === 0) continue

        const total = emptyAccumulator()
        const byMachine = new Map<string, { machineCode: string; accumulator: Accumulator }>()
        const byVersion = new Map<string, Accumulator>()
        for (const lot of lots) {
            addLot(total, lot)
            const machine = byMachine.get(lot.machineId) ?? { machineCode: lot.machineCode, accumulator: emptyAccumulator() }
            addLot(machine.accumulator, lot)
            byMachine.set(lot.machineId, machine)
            const version = byVersion.get(lot.versionSignature) ?? emptyAccumulator()
            addLot(version, lot)
            byVersion.set(lot.versionSignature, version)
        }

        // Makineler: kartı olanlar + pencerede üretim yapanlar.
        const machineIds = new Set([...mold.machineProfiles.map((profile) => profile.machineId), ...byMachine.keys()])
        const machines = [...machineIds].map((machineId): MoldMachineCycleStats => {
            const profile = mold.machineProfiles.find((entry) => entry.machineId === machineId)
            const usage = byMachine.get(machineId)
            const totals = toTotals(usage?.accumulator ?? emptyAccumulator())
            const cardCycleSec = profile?.cycleTimeSec ?? null
            return {
                machineId,
                machineCode: profile?.machineCode ?? usage?.machineCode ?? "",
                hasCard: Boolean(profile),
                cardCycleSec,
                ...totals,
                suggestion: cycleSuggestion({ ...totals, cardCycleSec }),
            }
        }).sort((a, b) => b.shots - a.shots || a.machineCode.localeCompare(b.machineCode, "tr"))

        const versions = [...byVersion.entries()]
            .map(([versionSignature, accumulator]) => ({ versionSignature, ...toTotals(accumulator) }))
            .sort((a, b) => b.shots - a.shots || a.versionSignature.localeCompare(b.versionSignature))

        const totals = toTotals(total)
        rows.push({
            moldId: mold.id,
            code: mold.code,
            name: mold.name,
            status: mold.status,
            standardCycleTimeSec: mold.standardCycleTimeSec,
            totalShots: mold.totalShots,
            lastMaintenanceAt: mold.lastMaintenanceAt,
            maintenance: moldMaintenanceStatus(mold, shotsAhead.get(mold.id) ?? 0),
            shotsAhead: shotsAhead.get(mold.id) ?? 0,
            ...totals,
            scrapRate: scrapRate(totals.goodQuantity, totals.scrapQuantity),
            machines,
            versions,
            suggestionCount: machines.filter((machine) => machine.suggestion).length,
        })
    }

    const summary: MoldStatsSummary = {
        moldCount: rows.length,
        usedMoldCount: rows.filter((row) => row.reportedLotCount > 0).length,
        reportedLotCount: rows.reduce((sum, row) => sum + row.reportedLotCount, 0),
        shots: rows.reduce((sum, row) => sum + row.shots, 0),
        goodQuantity: rows.reduce((sum, row) => sum + row.goodQuantity, 0),
        scrapQuantity: rows.reduce((sum, row) => sum + row.scrapQuantity, 0),
        scrapRate: null,
        // Bakımdaki, arızalı ya da kullanım dışı kalıp için bakım uyarısı anlamsız (uyarı taramasıyla aynı).
        maintenanceAlertCount: rows.filter((row) => row.status === "ACTIVE" && isMaintenanceAlert(row.maintenance)).length,
        suggestionCount: rows.reduce((sum, row) => sum + row.suggestionCount, 0),
    }
    summary.scrapRate = scrapRate(summary.goodQuantity, summary.scrapQuantity)
    return { rows, summary }
}
