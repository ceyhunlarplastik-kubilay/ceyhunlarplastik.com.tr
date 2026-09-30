/**
 * İş TAHMİNİ (planlanan ↔ gerçekleşen) — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 *  - İlerleme = raporlanan lotların baskısı / planlanan baskı (aile kalıbında da tutarlı).
 *  - Tahmini bitiş: kalan baskı (planlanan − raporlanan; üretimdeki lotun baskısı kalana dahil),
 *    PLANDAKİ çevrim ve verimle makinenin çalışma pencerelerine yerleştirilir (tatil, vardiya dışı,
 *    duruş düşülür). Raporlardaki sapma kalana yansır; geleceğin plan hızıyla gideceği varsayılır.
 *  - Başlangıç noktası: üretimdeki lotun gerçek başlangıcı; yoksa son raporlu lotun bitişi
 *    (duraklatılmış işte "şimdi" ile büyüğü); hiç başlamamışsa "şimdi" (+ bağlama süresi).
 *  - Durum: tamamlandı · üretim bitti (kapatılmayı bekliyor) · plana uygun · başlamadı (planlı
 *    üretim başlangıcı eşik kadar geçti) · geride (tahmini bitiş plandan eşik kadar geç) · süresi
 *    geçti (planlı bitiş geçti, iş kapanmadı).
 */
import type { ProductionJobStatus } from "./jobStateMachine"
import { computeProductionMinutes, scheduleForward } from "./jobScheduling"
import type { LotExecutionStatus } from "./lotReports"
import { resolveMachinePattern, type BoardMachineInput, type BoardShiftPattern } from "./productionBoard"
import { addDaysToDateKey } from "./productionCalendar"
import {
    formatDurationMinutes,
    formatProductionShortDateTime,
    PRODUCTION_TIME_ZONE,
    productionDateKey,
    wallTimeToUtc,
} from "./productionTime"
import {
    buildWorkingWindows,
    type CalendarExceptionForDay,
    type DowntimeInterval,
    type WorkingWindow,
} from "./shiftCalendar"

export type ForecastState = "DONE" | "PRODUCED" | "ON_TRACK" | "NOT_STARTED" | "BEHIND" | "OVERDUE"

/** Bu kadar dakikadan küçük sapma "plana uygun" sayılır. */
export const FORECAST_DELAY_THRESHOLD_MINUTES = 30

export const FORECAST_STATE_LABELS: Record<ForecastState, string> = {
    DONE: "Tamamlandı",
    PRODUCED: "Üretim bitti, kapatılmadı",
    ON_TRACK: "Plana uygun",
    NOT_STARTED: "Başlamadı",
    BEHIND: "Geride",
    OVERDUE: "Süresi geçti",
}

export type ForecastJobInput = {
    status: ProductionJobStatus
    setupStartAt: Date
    productionStartAt: Date
    plannedEndAt: Date
    plannedShots: number
    cycleTimeSec: number
    efficiencyPercent: number
    setupMinutes: number
}

export type ForecastLotInput = {
    status: LotExecutionStatus
    actualStartAt: Date | null
    actualEndAt: Date | null
    actualShots: number | null
    reported: boolean
}

export type JobForecast = {
    state: ForecastState
    /** 0–1 */
    progress: number
    reportedShots: number
    remainingShots: number
    /** `null`: ufukta çalışma penceresi yok (hesaplanamadı). */
    projectedEndAt: Date | null
    /** Tahmini bitiş − planlanan bitiş (≥ 0); hesaplanamadıysa `null`. */
    delayMinutes: number | null
    /** Tahmini bitiş, emrin (en yakın) termin gününün sonunu aşıyor. */
    dueRisk: boolean
}

const MINUTE_MS = 60_000
const later = (a: Date, b: Date) => (a.getTime() >= b.getTime() ? a : b)

/** Kalan üretimin başladığı an ve bağlamanın hâlâ yapılacak olup olmadığı. */
export function forecastStartPoint(job: ForecastJobInput, lots: ForecastLotInput[], now: Date): { startAt: Date; includeSetup: boolean } {
    const running = lots.find((lot) => lot.status === "RUNNING" && lot.actualStartAt)
    if (running?.actualStartAt) return { startAt: running.actualStartAt, includeSetup: false }

    const reportedEnds = lots.filter((lot) => lot.reported && lot.actualEndAt).map((lot) => lot.actualEndAt as Date)
    if (reportedEnds.length > 0) {
        const lastEnd = reportedEnds.reduce(later)
        return { startAt: job.status === "PAUSED" ? later(lastEnd, now) : lastEnd, includeSetup: false }
    }

    // Lot izlenmeden panoda "Üretimde" yapılmış iş: plandaki başlangıçta başladığı varsayılır.
    if (job.status === "RUNNING" || job.status === "PAUSED") {
        return { startAt: job.status === "PAUSED" ? later(job.productionStartAt, now) : job.productionStartAt, includeSetup: false }
    }
    return { startAt: later(job.setupStartAt, now), includeSetup: true }
}

/** İşin henüz basılmamış baskısı: planlanan − raporlanan (eksiye düşmez). Tahmin ve bakım öngörüsü ortak. */
export function remainingJobShots(plannedShots: number, reportedShots: number): number {
    return Math.max(0, plannedShots - reportedShots)
}

export function forecastJob(input: {
    job: ForecastJobInput
    lots: ForecastLotInput[]
    now: Date
    /** Emirlerin en yakın termininin SONU (termin günü bitişi); yoksa `null`. */
    dueEndAt: Date | null
    /** Başlangıç noktasından itibaren makinenin çalışma pencereleri. */
    windowsFrom: (from: Date) => WorkingWindow[]
}): JobForecast {
    const { job, lots, now } = input
    const reportedShots = lots.reduce((sum, lot) => sum + (lot.reported ? lot.actualShots ?? 0 : 0), 0)
    const progress = job.plannedShots > 0 ? Math.min(1, reportedShots / job.plannedShots) : 0
    const remainingShots = remainingJobShots(job.plannedShots, reportedShots)
    const base = { progress, reportedShots, remainingShots }

    if (job.status === "COMPLETED" || job.status === "CANCELLED") {
        return { ...base, state: "DONE", projectedEndAt: null, delayMinutes: 0, dueRisk: false }
    }

    const lastReportedEnd = lots
        .filter((lot) => lot.reported && lot.actualEndAt)
        .map((lot) => lot.actualEndAt as Date)
        .reduce<Date | null>((latest, end) => (latest ? later(latest, end) : end), null)

    let projectedEndAt: Date | null
    if (remainingShots === 0) {
        projectedEndAt = lastReportedEnd ?? now
    } else {
        const start = forecastStartPoint(job, lots, now)
        const schedule = scheduleForward({
            windows: input.windowsFrom(start.startAt),
            earliestStart: start.startAt,
            setupMinutes: start.includeSetup ? job.setupMinutes : 0,
            productionMinutes: computeProductionMinutes({ shots: remainingShots, cycleTimeSec: job.cycleTimeSec, efficiencyPercent: job.efficiencyPercent }),
        })
        // Geçmişte biten tahmin anlamsız: iş kapanmadıysa en erken "şimdi".
        projectedEndAt = schedule ? later(schedule.endAt, now) : null
    }

    const delayMinutes = projectedEndAt ? Math.max(0, (projectedEndAt.getTime() - job.plannedEndAt.getTime()) / MINUTE_MS) : null
    const dueRisk = input.dueEndAt ? projectedEndAt === null || projectedEndAt > input.dueEndAt : false

    const started = lots.some((lot) => lot.status === "RUNNING" || lot.reported) || job.status === "RUNNING" || job.status === "PAUSED"
    let state: ForecastState
    if (remainingShots === 0) state = "PRODUCED"
    else if (now > job.plannedEndAt) state = "OVERDUE"
    else if (!started && now.getTime() > job.productionStartAt.getTime() + FORECAST_DELAY_THRESHOLD_MINUTES * MINUTE_MS) state = "NOT_STARTED"
    else if (delayMinutes === null || delayMinutes > FORECAST_DELAY_THRESHOLD_MINUTES) state = "BEHIND"
    else state = "ON_TRACK"

    return { ...base, state, projectedEndAt, delayMinutes, dueRisk }
}

/** Gecikme uyarısı gösterilecek mi (tahtada işaret, uyarı şeridi). */
export function isForecastAlert(forecast: Pick<JobForecast, "state" | "dueRisk">): boolean {
    return isLateForecastState(forecast.state) || forecast.dueRisk
}

/** Gecikmiş sayılan durumlar: başlamadı, geride, süresi geçti. */
export function isLateForecastState(state: ForecastState): boolean {
    return state === "BEHIND" || state === "OVERDUE" || state === "NOT_STARTED"
}

/** İş sürüyor mu (tahmin anlamlı mı): kapanmamış ve üretimi bitmemiş. */
export function isProducingForecastState(state: ForecastState): boolean {
    return state === "ON_TRACK" || isLateForecastState(state)
}

type ForecastText = Pick<JobForecast, "state" | "delayMinutes" | "dueRisk"> & { projectedEndAt: Date | string | null }

/** "tahmini bitiş 29.09 14:30 (+1 sa 30 dk)" — fabrika saatiyle; hesaplanamadıysa bunu söyler. */
export function describeProjectedEnd(forecast: Pick<ForecastText, "projectedEndAt" | "delayMinutes">): string {
    if (!forecast.projectedEndAt) return "tahmini bitiş hesaplanamadı"
    const delay = forecast.delayMinutes && forecast.delayMinutes >= 1 ? ` (+${formatDurationMinutes(forecast.delayMinutes)})` : ""
    return `tahmini bitiş ${formatProductionShortDateTime(forecast.projectedEndAt)}${delay}`
}

/** "Geride · tahmini bitiş 29.09 14:30 (+1 sa 30 dk) · termin riski" — tahta, uyarı şeridi, bildirim. */
export function describeForecast(forecast: ForecastText): string {
    const parts: string[] = [FORECAST_STATE_LABELS[forecast.state]]
    if (isProducingForecastState(forecast.state)) parts.push(describeProjectedEnd(forecast))
    if (forecast.dueRisk) parts.push("termin riski")
    return parts.join(" · ")
}

// ---- Makine takvimi ve termin (tahta ve "sonrakileri kaydır" aynı hesabı kullanır) ----

/** Tahmin ufku: kalan üretim bu kadar gün içinde yerleşmezse "hesaplanamadı". */
export const FORECAST_HORIZON_DAYS = 45
/** Tahmin, bugünden önce başlamış üretimi de hesaba katar (üretimdeki lot günler önce başlamış olabilir). */
export const FORECAST_LOOKBACK_DAYS = 31
const DAY_MS = 86_400_000

/**
 * Tahmin için takvim istisnası / duruş okuma aralığı: pencereyi ve BUGÜNÜ birlikte kapsar (geriye
 * 31, ileriye ufuk + 2 gün). Tahmin üretimin gerçek başından / şimdiden ileri yürür — pencere geçmişte
 * ya da uzak gelecekte olsa da. Tahta ile uyarı taraması aynı aralığı okur.
 */
export function forecastCalendarRange(input: { from: string; to: string; windowStart: Date; windowEnd: Date; now: Date }): {
    exceptions: { from: string; to: string }
    downtimes: { from: Date; to: Date }
} {
    const today = productionDateKey(input.now)
    return {
        exceptions: {
            from: addDaysToDateKey(input.from < today ? input.from : today, -FORECAST_LOOKBACK_DAYS),
            to: addDaysToDateKey(input.to > today ? input.to : today, FORECAST_HORIZON_DAYS + 2),
        },
        downtimes: {
            from: new Date(Math.min(input.windowStart.getTime(), input.now.getTime()) - FORECAST_LOOKBACK_DAYS * DAY_MS),
            to: new Date(Math.max(input.windowEnd.getTime(), input.now.getTime()) + (FORECAST_HORIZON_DAYS + 2) * DAY_MS),
        },
    }
}

export type ForecastableJob = ForecastJobInput & {
    id: string
    machineId: string
    lots: ForecastLotInput[]
    /** Emirlerin terminleri ("YYYY-MM-DD"); terminsiz emir `null`. */
    dueDates: Array<string | null>
}

/**
 * Birden çok işin tahmini — her iş kendi makinesinin takvimiyle (düzen, istisna, o makinenin
 * duruşları). Makinesi bulunamayan işin takvimi boştur (tahmin "hesaplanamadı"). Tahta ve uyarı
 * taraması bunu kullanır.
 */
export function forecastJobsOnMachines(input: {
    jobs: ForecastableJob[]
    machines: BoardMachineInput[]
    areaShiftPatternIds: Record<string, string | null>
    patterns: BoardShiftPattern[]
    exceptions: CalendarExceptionForDay[]
    downtimes: Array<DowntimeInterval & { machineId: string }>
    now: Date
}): Map<string, JobForecast> {
    const machineById = new Map(input.machines.map((machine) => [machine.id, machine]))
    const windowsByMachine = new Map<string, (from: Date) => WorkingWindow[]>()
    const windowsFor = (machineId: string) => {
        const cached = windowsByMachine.get(machineId)
        if (cached) return cached
        const machine = machineById.get(machineId)
        const windowsFrom = machine
            ? machineWindowsFrom({
                machine,
                areaShiftPatternIds: input.areaShiftPatternIds,
                patterns: input.patterns,
                exceptions: input.exceptions,
                downtimes: input.downtimes.filter((downtime) => downtime.machineId === machine.id),
            })
            : () => []
        windowsByMachine.set(machineId, windowsFrom)
        return windowsFrom
    }
    return new Map(input.jobs.map((job) => [job.id, forecastJob({
        job,
        lots: job.lots,
        now: input.now,
        dueEndAt: dueEndAtFor(job.dueDates),
        windowsFrom: windowsFor(job.machineId),
    })]))
}

/** Kalıp başına kapanmamış işlerin kalan baskısı (bakım öngörüsü). */
export function remainingShotsByMold(jobs: Array<{ id: string; moldId: string }>, forecasts: Map<string, JobForecast>): Map<string, number> {
    const totals = new Map<string, number>()
    for (const job of jobs) {
        const forecast = forecasts.get(job.id)
        const remaining = !forecast || forecast.state === "DONE" ? 0 : forecast.remainingShots
        totals.set(job.moldId, (totals.get(job.moldId) ?? 0) + remaining)
    }
    return totals
}

/** Makinenin geçerli düzeniyle `from`'dan itibaren çalışma pencereleri (duruşlar düşülmüş). */
export function machineWindowsFrom(input: {
    machine: BoardMachineInput
    areaShiftPatternIds: Record<string, string | null>
    patterns: BoardShiftPattern[]
    exceptions: CalendarExceptionForDay[]
    downtimes: DowntimeInterval[]
}): (from: Date) => WorkingWindow[] {
    const pattern = resolveMachinePattern(input.machine, input.areaShiftPatternIds, input.patterns)
    return (from: Date) => (pattern
        ? buildWorkingWindows({
            shifts: pattern.shifts,
            from,
            to: new Date(from.getTime() + FORECAST_HORIZON_DAYS * 86_400_000),
            exceptions: input.exceptions,
            downtimes: input.downtimes,
            machineId: input.machine.id,
            areaId: input.machine.areaId,
            timeZone: pattern.timezone,
        })
        : [])
}

/** En yakın termin gününün sonu (fabrika saatiyle ertesi gün 00:00); termin yoksa `null`. */
export function dueEndAtFor(dueDates: Array<string | null>): Date | null {
    const earliest = dueDates.filter((date): date is string => Boolean(date)).sort()[0]
    return earliest ? wallTimeToUtc(`${addDaysToDateKey(earliest, 1)}T00:00`, PRODUCTION_TIME_ZONE) : null
}
