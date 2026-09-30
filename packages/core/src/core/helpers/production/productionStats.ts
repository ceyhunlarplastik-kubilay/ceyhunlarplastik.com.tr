/**
 * Üretim istatistikleri (Faz 5) — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 * 5.1 Ürün geçmişi: bir ürün modelinin (ölçü / versiyon süzgeçli) her üretimi bir satır.
 *  - Adet: iş KAPANDIYSA (Tamamlandı) kapanışta girilen KESİN sayım; sürüyorsa raporlu vardiya
 *    lotlarının toplamı (kullanıcı kararı, 2026-09-28). İş toplamı ile lot toplamı ayrı tutulur (4.2).
 *  - Gerçekleşen çevrim: raporlu lotlarda net çalışma (lot süresi − kayıtlı duruş) ÷ baskı. Kayda
 *    geçmeyen küçük duruşlar çalışmanın içinde kalır — bu yüzden plandaki çevrimle oranı OEE'nin
 *    performans bileşenidir.
 *  - Aile kalıbında her ölçü kendi satırında; çevrim ve süre İŞE aittir (tek baskı tüm gözleri
 *    doldurur), özetlerde iş başına bir kez sayılır.
 */
import type { ProductionJobStatus } from "./jobStateMachine"
import { computeProductionMinutes } from "./jobScheduling"
import type { LotExecutionStatus } from "./lotReports"
import { addDaysToDateKey, isValidDateKey } from "./productionCalendar"
import { productionDateKey } from "./productionTime"

/** Bir sorguda en çok bu kadar iş (en yeniler); fazlası `truncated` ile bildirilir. */
export const PRODUCT_HISTORY_JOB_LIMIT = 500
/** İstatistik penceresi en fazla (gün). */
export const STATS_MAX_RANGE_DAYS = 3 * 366
/** Varsayılan pencere: son 12 ay (bugün dahil). */
export const STATS_DEFAULT_RANGE_DAYS = 365

/** Geçmişte sayılan iş durumları: üretime başlamış ya da bitmiş (planlı / sahaya verilmiş değil). */
export const PRODUCT_HISTORY_JOB_STATUSES: ProductionJobStatus[] = ["SETUP", "RUNNING", "PAUSED", "COMPLETED"]

/** Varsayılan pencere: son 12 ay, fabrika takvimiyle. */
export function defaultStatsRange(now: Date): { from: string; to: string } {
    return recentStatsRange(now, STATS_DEFAULT_RANGE_DAYS)
}

function dayCount(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
}

/** Pencere geçersizse Türkçe mesaj, geçerliyse `null`. `maxDays` ekrana göre (ürün 3 yıl, makine 1 yıl). */
export function findStatsRangeIssue(from: string, to: string, maxDays: number = STATS_MAX_RANGE_DAYS): string | null {
    if (!isValidDateKey(from) || !isValidDateKey(to)) return "Tarihler YYYY-AA-GG biçiminde olmalı."
    if (from > to) return "Başlangıç tarihi bitişten sonra olamaz."
    if (dayCount(from, to) > maxDays) return `İstatistik penceresi en fazla ${maxDays >= 366 ? `${Math.round(maxDays / 366)} yıl` : `${maxDays} gün`} olabilir.`
    return null
}

/** Son `days` gün (bugün dahil), fabrika takvimiyle. */
export function recentStatsRange(now: Date, days: number): { from: string; to: string } {
    const to = productionDateKey(now)
    return { from: addDaysToDateKey(to, -(days - 1)), to }
}

export type StatsLotInput = {
    status: LotExecutionStatus
    actualStartAt: Date | null
    actualEndAt: Date | null
    actualShots: number | null
    reported: boolean
    /** Lottaki kayıtlı duruşların toplamı (dk). */
    stopMinutes: number
    outputs: Array<{ jobOutputId: string; goodQuantity: number; scrapQuantity: number }>
}

export type JobRunStats = {
    reportedLotCount: number
    /** Raporlu lotların brüt süresi (başlangıç → bitiş), dk. */
    grossMinutes: number
    /** Kayıtlı duruşlar (lot süresini aşamaz), dk. */
    stopMinutes: number
    /** Net çalışma = brüt − duruş, dk. */
    runMinutes: number
    /** Raporlu lotlardaki baskı. */
    shots: number
    /** Net çalışma ÷ baskı (sn); veri yoksa `null`. */
    actualCycleSec: number | null
    /** İlk gerçek başlangıç (üretimdeki lot dahil). */
    firstStartAt: Date | null
    /** Son raporlu lotun bitişi. */
    lastEndAt: Date | null
}

const MINUTE_MS = 60_000

export function jobRunStats(lots: StatsLotInput[]): JobRunStats {
    let reportedLotCount = 0
    let grossMinutes = 0
    let stopMinutes = 0
    let shots = 0
    let firstStartAt: Date | null = null
    let lastEndAt: Date | null = null

    for (const lot of lots) {
        if (lot.actualStartAt && (!firstStartAt || lot.actualStartAt < firstStartAt)) firstStartAt = lot.actualStartAt
        if (!lot.reported || !lot.actualStartAt || !lot.actualEndAt) continue
        const gross = Math.max(0, (lot.actualEndAt.getTime() - lot.actualStartAt.getTime()) / MINUTE_MS)
        reportedLotCount += 1
        grossMinutes += gross
        stopMinutes += Math.min(Math.max(0, lot.stopMinutes), gross)
        shots += Math.max(0, lot.actualShots ?? 0)
        if (!lastEndAt || lot.actualEndAt > lastEndAt) lastEndAt = lot.actualEndAt
    }

    const runMinutes = Math.max(0, grossMinutes - stopMinutes)
    return {
        reportedLotCount,
        grossMinutes,
        stopMinutes,
        runMinutes,
        shots,
        actualCycleSec: shots > 0 && runMinutes > 0 ? (runMinutes * 60) / shots : null,
        firstStartAt,
        lastEndAt,
    }
}

export type StatsJobInput = {
    id: string
    lotBaseNumber: number
    status: ProductionJobStatus
    versionSignature: string
    machineCode: string
    moldCode: string
    productionStartAt: Date
    plannedEndAt: Date
    plannedShots: number
    cycleTimeSec: number
    efficiencyPercent: number
    outputs: Array<{
        id: string
        productSizeId: string
        cavities: number
        plannedQuantity: number
        /** Kapanışta girilen kesin sayım (iş tamamlanmadıysa 0). */
        goodQuantity: number
        scrapQuantity: number
        order: { orderNumber: string; variantCode: string } | null
    }>
    lots: StatsLotInput[]
}

export type HistorySize = { id: string; sizeCode: string; label: string }
export type HistoryVersion = { code: string; colorName: string | null; colorHex: string | null; materials: string[] }

export type ProductHistoryRow = {
    jobId: string
    jobOutputId: string
    lotBaseNumber: number
    jobStatus: ProductionJobStatus
    /** Adet kapanıştaki kesin sayım mı (yoksa raporlu vardiyaların toplamı — iş sürüyor). */
    finalCount: boolean
    machineCode: string
    moldCode: string
    cavities: number
    size: HistorySize
    /** İşin baskı ayarı bu ürün modelinin bir versiyonuna denk gelmiyorsa `null`. */
    version: HistoryVersion | null
    order: { orderNumber: string; variantCode: string } | null
    plannedStartAt: Date
    plannedEndAt: Date
    startedAt: Date | null
    endedAt: Date | null
    lotCount: number
    reportedLotCount: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    /** Fire ÷ (sağlam + fire); sayım yoksa `null`. */
    scrapRate: number | null
    plannedCycleSec: number
    actualCycleSec: number | null
    /** Plandaki üretim süresi (verim payı dahil, bağlama hariç), dk. */
    plannedMinutes: number
    /** Raporlu vardiyaların brüt ve net süresi, dk. */
    grossMinutes: number
    runMinutes: number
}

export type ProductHistorySummary = {
    jobCount: number
    rowCount: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    scrapRate: number | null
    reportedLotCount: number
    /** Baskı ağırlıklı plan çevrimi (gerçekleşenle aynı işler üzerinden). */
    plannedCycleSec: number | null
    actualCycleSec: number | null
    /** İş sayısı üst sınıra takıldı (en yeni `PRODUCT_HISTORY_JOB_LIMIT` iş). */
    truncated: boolean
}

function rate(scrap: number, good: number): number | null {
    return good + scrap > 0 ? scrap / (good + scrap) : null
}

/**
 * İşin ÜRETİM dönemi: gerçekleşen varsa ilk gerçek başlangıç → (tamamlandıysa son raporlu bitiş,
 * sürüyorsa şimdi); hiç başlamamışsa planlı üretim aralığı. Pencere süzgeci buna göre — sorgu geniş
 * bir üst küme getirir (planlı aralığı kesişen ya da lotu pencerede başlayan), kesin eleme burada.
 */
export function jobProductionPeriod(
    job: Pick<StatsJobInput, "status" | "productionStartAt" | "plannedEndAt">,
    run: Pick<JobRunStats, "firstStartAt" | "lastEndAt">,
    now: Date,
): { start: Date; end: Date } {
    if (!run.firstStartAt) return { start: job.productionStartAt, end: job.plannedEndAt }
    const end = job.status === "COMPLETED" ? (run.lastEndAt ?? run.firstStartAt) : now
    return { start: run.firstStartAt, end: end < run.firstStartAt ? run.firstStartAt : end }
}

/**
 * Ürün geçmişi satırları (en yeni önce) ve özet. Yalnız `sizes`'taki ölçülerin çıktıları satır olur
 * (aile kalıbındaki başka ürünlerin gözleri dışarıda kalır); özet çevrimi iş başına bir kez sayar.
 */
export function buildProductHistory(input: {
    jobs: StatsJobInput[]
    sizes: ReadonlyMap<string, HistorySize>
    versions: ReadonlyMap<string, HistoryVersion>
    truncated: boolean
    /** Pencere [başlangıç, bitiş) — işin üretim dönemi kesişmeli (`jobProductionPeriod`). */
    window: { start: Date; end: Date }
    now: Date
}): { rows: ProductHistoryRow[]; summary: ProductHistorySummary } {
    const rows: ProductHistoryRow[] = []
    let cycleShots = 0
    let actualCycleWeighted = 0
    let plannedCycleWeighted = 0
    let reportedLotCount = 0
    const countedJobs = new Set<string>()

    for (const job of input.jobs) {
        const outputs = job.outputs.filter((output) => input.sizes.has(output.productSizeId))
        if (outputs.length === 0) continue
        const run = jobRunStats(job.lots)
        const period = jobProductionPeriod(job, run, input.now)
        if (period.start >= input.window.end || period.end < input.window.start) continue
        const finalCount = job.status === "COMPLETED"
        const version = input.versions.get(job.versionSignature) ?? null

        if (!countedJobs.has(job.id)) {
            countedJobs.add(job.id)
            reportedLotCount += run.reportedLotCount
            if (run.actualCycleSec !== null) {
                cycleShots += run.shots
                actualCycleWeighted += run.runMinutes * 60
                plannedCycleWeighted += job.cycleTimeSec * run.shots
            }
        }

        for (const output of outputs) {
            const reported = job.lots.flatMap((lot) => (lot.reported ? lot.outputs.filter((entry) => entry.jobOutputId === output.id) : []))
            const goodQuantity = finalCount ? output.goodQuantity : reported.reduce((sum, entry) => sum + entry.goodQuantity, 0)
            const scrapQuantity = finalCount ? output.scrapQuantity : reported.reduce((sum, entry) => sum + entry.scrapQuantity, 0)
            rows.push({
                jobId: job.id,
                jobOutputId: output.id,
                lotBaseNumber: job.lotBaseNumber,
                jobStatus: job.status,
                finalCount,
                machineCode: job.machineCode,
                moldCode: job.moldCode,
                cavities: output.cavities,
                size: input.sizes.get(output.productSizeId) as HistorySize,
                version,
                order: output.order,
                plannedStartAt: job.productionStartAt,
                plannedEndAt: job.plannedEndAt,
                startedAt: run.firstStartAt,
                endedAt: finalCount ? run.lastEndAt : null,
                lotCount: job.lots.length,
                reportedLotCount: run.reportedLotCount,
                plannedQuantity: output.plannedQuantity,
                goodQuantity,
                scrapQuantity,
                scrapRate: rate(scrapQuantity, goodQuantity),
                plannedCycleSec: job.cycleTimeSec,
                actualCycleSec: run.actualCycleSec,
                plannedMinutes: computeProductionMinutes({ shots: job.plannedShots, cycleTimeSec: job.cycleTimeSec, efficiencyPercent: job.efficiencyPercent }),
                grossMinutes: run.grossMinutes,
                runMinutes: run.runMinutes,
            })
        }
    }

    rows.sort((a, b) => (b.startedAt ?? b.plannedStartAt).getTime() - (a.startedAt ?? a.plannedStartAt).getTime() || b.lotBaseNumber - a.lotBaseNumber)

    const plannedQuantity = rows.reduce((sum, row) => sum + row.plannedQuantity, 0)
    const goodQuantity = rows.reduce((sum, row) => sum + row.goodQuantity, 0)
    const scrapQuantity = rows.reduce((sum, row) => sum + row.scrapQuantity, 0)
    return {
        rows,
        summary: {
            jobCount: countedJobs.size,
            rowCount: rows.length,
            plannedQuantity,
            goodQuantity,
            scrapQuantity,
            scrapRate: rate(scrapQuantity, goodQuantity),
            reportedLotCount,
            plannedCycleSec: cycleShots > 0 ? plannedCycleWeighted / cycleShots : null,
            actualCycleSec: cycleShots > 0 ? actualCycleWeighted / cycleShots : null,
            truncated: input.truncated,
        },
    }
}
