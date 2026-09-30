/**
 * Makine kullanımı ve OEE (Faz 5.2) — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 * İki ayrı ölçü var; ikisi de makine başına:
 *
 * 1) ZAMAN (saat bazlı, pencereye kırpılmış) — "vardiya süresi nereye gitti?":
 *    - Vardiya süresi: makinenin geçerli vardiya düzeninden çalışma pencereleri (takvim istisnaları
 *      düşülmüş; tatil / toplu izin yok sayılır).
 *    - Üretim: raporlu vardiyaların (lot) gerçek başlangıç → bitiş aralıkları. Vardiya dışına düşen
 *      kısmı ayrıca "vardiya dışı üretim"dir. Üretim süresi lot raporundaki duruşlarla net çalışma /
 *      duruş kategorilerine lotun kendi oranıyla bölünür (duruşların saati bilinmez).
 *    - Makine duruşu: Makineler sayfasındaki kayıtların vardiya içinde, ÜRETİMLE ÇAKIŞMAYAN kısmı
 *      (üretim sürerken girilmiş bir arıza lot raporunda zaten duruş olarak durur; iki kez sayılmaz).
 *      Türler çakışırsa sırayla (planlı bakım → arıza → diğer) bir kez sayılır.
 *    - Boş: vardiya süresinin kalan kısmı (plansız ya da raporsuz).
 *    Böylece vardiya süresi = vardiya içi üretim + makine duruşu + boş (tam toplanır).
 *    Kullanım = vardiya içi üretim ÷ vardiya süresi.
 *
 * 2) RAPOR (vardiya bazlı) — OEE, pencerede BAŞLAYAN raporlu vardiyalardan (kullanıcı onayı,
 *    2026-09-28); vardiya, başladığı pencereye bütün olarak yazılır:
 *    - Kullanılabilirlik = net çalışma ÷ (üretim süresi − planlı duruşlar)
 *    - Performans = (plandaki çevrim × baskı) ÷ net çalışma (%100'ü aşarsa plan çevrimi yavaş)
 *    - Kalite = sağlam ÷ (sağlam + fire)
 *    Makine duruşu kayıtları OEE'ye GİRMEZ. Toplamlarda oranlar ortalamadan değil, toplanan
 *    sürelerden hesaplanır.
 *
 * Raporsuz vardiya (veri kalitesi): iş tamamlanırken raporu girilmeden kapanan vardiya. Erken biten
 * işin tamamlanmadan SONRAYA planlanmış, hiç başlamamış vardiyaları üretim değildir, sayılmaz.
 */
import { resolveMachinePattern, type BoardMachineInput, type BoardShiftPattern } from "./productionBoard"
import { STOP_CATEGORIES, type ProductionStopCategory } from "./productionReasons"
import { buildWorkingWindows, type CalendarExceptionForDay } from "./shiftCalendar"

/** Makine istatistiği penceresi en fazla (gün) — kapasite her gün için vardiyadan hesaplanır. */
export const MACHINE_STATS_MAX_RANGE_DAYS = 366
/** Varsayılan pencere: son 30 gün (bugün dahil). */
export const MACHINE_STATS_DEFAULT_RANGE_DAYS = 30
/** En çok süre kaybettiren duruş nedenlerinden kaç tanesi döner. */
export const MACHINE_STATS_TOP_REASON_COUNT = 10

export const OEE_GOOD_THRESHOLD = 0.85
export const OEE_FAIR_THRESHOLD = 0.6

export type OeeLevel = "good" | "fair" | "poor"

/** ≥ %85 iyi, %60–85 orta, altı düşük. */
export function oeeLevel(oee: number | null): OeeLevel | null {
    if (oee === null) return null
    return oee >= OEE_GOOD_THRESHOLD ? "good" : oee >= OEE_FAIR_THRESHOLD ? "fair" : "poor"
}

export type DowntimeKind = "PLANNED_MAINTENANCE" | "BREAKDOWN" | "OTHER"
/** Sıra önemli: çakışan makine duruşu kayıtları bu sırayla bir kez sayılır. */
export const DOWNTIME_KINDS: DowntimeKind[] = ["PLANNED_MAINTENANCE", "BREAKDOWN", "OTHER"]

export type MachineStatsLotInput = {
    machineId: string
    actualStartAt: Date
    actualEndAt: Date
    actualShots: number | null
    /** İşin planlama anındaki çevrimi (sn). */
    cycleTimeSec: number
    stops: Array<{ minutes: number; category: ProductionStopCategory | null; reasonId: string; reasonCode: string; reasonName: string }>
    goodQuantity: number
    scrapQuantity: number
}

/** Raporsuz kapanmış olabilecek vardiya: tamamlanan işin raporu girilmemiş lotu. */
export type UnreportedLotCandidate = {
    machineId: string
    plannedStartAt: Date
    actualStartAt: Date | null
    /** İşin tamamlandığı an (durum geçmişinden); bilinmiyorsa null. */
    jobCompletedAt: Date | null
}

export type MachineStatsMachineInput = BoardMachineInput & {
    code: string
    name: string
    areaCode: string
    status: "ACTIVE" | "MAINTENANCE" | "BREAKDOWN" | "INACTIVE"
}

export type MachineTimeBreakdown = {
    /** Vardiya süresi (takvim istisnaları düşülmüş). */
    capacityMinutes: number
    /** Pencerede raporlu üretimde geçen süre (vardiya dışı dahil). */
    productionMinutes: number
    /** Üretimin vardiya dışına düşen kısmı. */
    overtimeMinutes: number
    /** Üretim süresinin net çalışma / duruş kırılımı (lot raporundaki oranla). */
    runMinutes: number
    stopMinutes: Record<ProductionStopCategory, number>
    /** Makine duruşu kayıtlarının vardiya içinde, üretimle çakışmayan kısmı. */
    downtimeMinutes: Record<DowntimeKind, number>
    idleMinutes: number
}

export type MachineReportTotals = {
    reportedLotCount: number
    unreportedLotCount: number
    grossMinutes: number
    stopMinutes: Record<ProductionStopCategory, number>
    runMinutes: number
    shots: number
    /** Plandaki çevrimle bu baskının süresi (dk). */
    idealMinutes: number
    goodQuantity: number
    scrapQuantity: number
}

export type MachineStatsRatios = {
    /** Vardiya içi üretim ÷ vardiya süresi. */
    utilization: number | null
    availability: number | null
    performance: number | null
    quality: number | null
    oee: number | null
}

export type MachineStatsTotals = { time: MachineTimeBreakdown; report: MachineReportTotals } & MachineStatsRatios
export type MachineStatsRow = MachineStatsTotals & { machineId: string; code: string; name: string; areaCode: string }

export type StopReasonTotal = {
    reasonId: string
    code: string
    name: string
    category: ProductionStopCategory
    minutes: number
    count: number
}

const MINUTE_MS = 60_000

/** Yarı açık [başlangıç, bitiş) aralık, ms. */
type Span = readonly [number, number]

/** Sıralı, çakışmasız aralıklar (dokunan aralıklar birleşir). */
function mergeSpans(spans: Span[]): Span[] {
    const sorted = spans.filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const merged: Array<[number, number]> = []
    for (const [start, end] of sorted) {
        const last = merged[merged.length - 1]
        if (last && start <= last[1]) last[1] = Math.max(last[1], end)
        else merged.push([start, end])
    }
    return merged
}

function spanMinutes(spans: Span[]): number {
    return spans.reduce((sum, [start, end]) => sum + (end - start), 0) / MINUTE_MS
}

/** İki birleşmiş aralık listesinin kesişim süresi (dk) — iki işaretçiyle, doğrusal. */
function overlapMinutes(a: Span[], b: Span[]): number {
    let total = 0
    let i = 0
    let j = 0
    while (i < a.length && j < b.length) {
        const start = Math.max(a[i][0], b[j][0])
        const end = Math.min(a[i][1], b[j][1])
        if (end > start) total += end - start
        if (a[i][1] < b[j][1]) i += 1
        else j += 1
    }
    return total / MINUTE_MS
}

function toSpan(interval: { startAt: Date; endAt: Date }, window: { start: Date; end: Date }): Span {
    return [
        Math.max(interval.startAt.getTime(), window.start.getTime()),
        Math.min(interval.endAt.getTime(), window.end.getTime()),
    ]
}

function emptyStops(): Record<ProductionStopCategory, number> {
    return Object.fromEntries(STOP_CATEGORIES.map((category) => [category, 0])) as Record<ProductionStopCategory, number>
}

function emptyDowntimes(): Record<DowntimeKind, number> {
    return { PLANNED_MAINTENANCE: 0, BREAKDOWN: 0, OTHER: 0 }
}

function emptyTime(): MachineTimeBreakdown {
    return {
        capacityMinutes: 0,
        productionMinutes: 0,
        overtimeMinutes: 0,
        runMinutes: 0,
        stopMinutes: emptyStops(),
        downtimeMinutes: emptyDowntimes(),
        idleMinutes: 0,
    }
}

function emptyReport(): MachineReportTotals {
    return {
        reportedLotCount: 0,
        unreportedLotCount: 0,
        grossMinutes: 0,
        stopMinutes: emptyStops(),
        runMinutes: 0,
        shots: 0,
        idealMinutes: 0,
        goodQuantity: 0,
        scrapQuantity: 0,
    }
}

function ratio(numerator: number, denominator: number): number | null {
    return denominator > 0 ? numerator / denominator : null
}

function withRatios(time: MachineTimeBreakdown, report: MachineReportTotals): MachineStatsTotals {
    const availability = ratio(report.runMinutes, report.grossMinutes - report.stopMinutes.PLANNED)
    const performance = ratio(report.idealMinutes, report.runMinutes)
    const quality = ratio(report.goodQuantity, report.goodQuantity + report.scrapQuantity)
    return {
        time,
        report,
        utilization: ratio(time.productionMinutes - time.overtimeMinutes, time.capacityMinutes),
        availability,
        performance,
        quality,
        oee: availability !== null && performance !== null && quality !== null ? availability * performance * quality : null,
    }
}

/** Lotun raporundaki duruşlar — kategori başına, lot süresini aşmayacak biçimde kırpılmış. */
function lotStops(lot: MachineStatsLotInput, grossMinutes: number) {
    let remaining = grossMinutes
    return lot.stops.map((stop) => {
        // Duruşlar lot süresini aşamaz (rapor kuralı; eski veride yine de kırp).
        const minutes = Math.min(Math.max(0, stop.minutes), remaining)
        remaining -= minutes
        return { ...stop, category: stop.category ?? ("OTHER" as const), minutes }
    })
}

/** Raporsuz kapanan vardiya mı? (pencere: gerçek başlangıç, yoksa planlanan başlangıç) */
export function isUnreportedClosedLot(lot: UnreportedLotCandidate, window: { start: Date; end: Date }): boolean {
    const startAt = lot.actualStartAt ?? lot.plannedStartAt
    if (startAt < window.start || startAt >= window.end) return false
    // Erken biten işin tamamlanmadan SONRAYA planlanmış, hiç başlamamış vardiyası üretim değildir.
    return lot.actualStartAt !== null || lot.jobCompletedAt === null || lot.plannedStartAt < lot.jobCompletedAt
}

/**
 * Makinenin zaman dağılımı. `lots` pencereyle KESİŞEN raporlu vardiyalardır (öncesinde başlayıp
 * pencereye taşan dahil); her biri pencereye kırpılır.
 */
export function machineTimeBreakdown(input: {
    machine: BoardMachineInput
    areaShiftPatternIds: Record<string, string | null>
    patterns: BoardShiftPattern[]
    exceptions: CalendarExceptionForDay[]
    downtimes: Array<{ startAt: Date; endAt: Date; kind: DowntimeKind }>
    lots: MachineStatsLotInput[]
    window: { start: Date; end: Date }
}): MachineTimeBreakdown {
    const time = emptyTime()
    const pattern = resolveMachinePattern(input.machine, input.areaShiftPatternIds, input.patterns)
    const shifts = pattern
        ? mergeSpans(buildWorkingWindows({
            shifts: pattern.shifts,
            from: input.window.start,
            to: input.window.end,
            exceptions: input.exceptions,
            downtimes: [],
            machineId: input.machine.id,
            areaId: input.machine.areaId,
            timeZone: pattern.timezone,
        }).map((window) => toSpan(window, input.window)))
        : []
    const production = mergeSpans(input.lots.map((lot) => toSpan({ startAt: lot.actualStartAt, endAt: lot.actualEndAt }, input.window)))

    time.capacityMinutes = spanMinutes(shifts)
    time.productionMinutes = spanMinutes(production)
    const productionInShift = overlapMinutes(shifts, production)
    time.overtimeMinutes = Math.max(0, time.productionMinutes - productionInShift)

    // Makine duruşu: vardiya içinde, üretimle ve önceki türlerle çakışmayan kısım.
    let blocked = production
    let blockedInShift = productionInShift
    for (const kind of DOWNTIME_KINDS) {
        const ofKind = input.downtimes.filter((downtime) => downtime.kind === kind)
        if (ofKind.length === 0) continue
        const next = mergeSpans([...blocked, ...ofKind.map((downtime) => toSpan(downtime, input.window))])
        const nextInShift = overlapMinutes(shifts, next)
        time.downtimeMinutes[kind] = Math.max(0, nextInShift - blockedInShift)
        blocked = next
        blockedInShift = nextInShift
    }
    time.idleMinutes = Math.max(0, time.capacityMinutes - blockedInShift)

    // Pencere içindeki üretim süresi lotun kendi net çalışma / duruş oranıyla bölünür.
    for (const lot of input.lots) {
        const grossMinutes = (lot.actualEndAt.getTime() - lot.actualStartAt.getTime()) / MINUTE_MS
        if (grossMinutes <= 0) continue
        const [start, end] = toSpan({ startAt: lot.actualStartAt, endAt: lot.actualEndAt }, input.window)
        const share = Math.max(0, end - start) / MINUTE_MS / grossMinutes
        if (share === 0) continue
        let stopped = 0
        for (const stop of lotStops(lot, grossMinutes)) {
            time.stopMinutes[stop.category] += stop.minutes * share
            stopped += stop.minutes
        }
        time.runMinutes += (grossMinutes - stopped) * share
    }
    return time
}

function addInto<K extends string>(target: Record<K, number>, source: Record<K, number>) {
    for (const key of Object.keys(source) as K[]) target[key] += source[key]
}

export function buildMachineStats(input: {
    window: { start: Date; end: Date }
    machines: MachineStatsMachineInput[]
    areaShiftPatternIds: Record<string, string | null>
    patterns: BoardShiftPattern[]
    exceptions: CalendarExceptionForDay[]
    downtimes: Array<{ machineId: string; startAt: Date; endAt: Date; kind: DowntimeKind }>
    /** Pencereyle KESİŞEN raporlu vardiyalar; OEE yalnız pencerede başlayanlardan. */
    lots: MachineStatsLotInput[]
    unreportedLots: UnreportedLotCandidate[]
    topReasonCount?: number
}): { rows: MachineStatsRow[]; totals: MachineStatsTotals; stopReasons: StopReasonTotal[] } {
    const lotsByMachine = new Map<string, MachineStatsLotInput[]>()
    for (const lot of input.lots) lotsByMachine.set(lot.machineId, [...(lotsByMachine.get(lot.machineId) ?? []), lot])
    const unreportedByMachine = new Map<string, number>()
    for (const lot of input.unreportedLots) {
        if (isUnreportedClosedLot(lot, input.window)) unreportedByMachine.set(lot.machineId, (unreportedByMachine.get(lot.machineId) ?? 0) + 1)
    }

    const reasons = new Map<string, StopReasonTotal>()
    const totalTime = emptyTime()
    const totalReport = emptyReport()
    const rows: MachineStatsRow[] = []

    for (const machine of input.machines) {
        const lots = lotsByMachine.get(machine.id) ?? []
        const time = machineTimeBreakdown({
            machine,
            areaShiftPatternIds: input.areaShiftPatternIds,
            patterns: input.patterns,
            exceptions: input.exceptions,
            downtimes: input.downtimes.filter((downtime) => downtime.machineId === machine.id),
            lots,
            window: input.window,
        })

        const report = emptyReport()
        report.unreportedLotCount = unreportedByMachine.get(machine.id) ?? 0
        for (const lot of lots) {
            // Vardiya başladığı pencereye bütün olarak yazılır.
            if (lot.actualStartAt < input.window.start || lot.actualStartAt >= input.window.end) continue
            const grossMinutes = Math.max(0, (lot.actualEndAt.getTime() - lot.actualStartAt.getTime()) / MINUTE_MS)
            let stopped = 0
            for (const stop of lotStops(lot, grossMinutes)) {
                report.stopMinutes[stop.category] += stop.minutes
                stopped += stop.minutes
                const reason = reasons.get(stop.reasonId)
                    ?? { reasonId: stop.reasonId, code: stop.reasonCode, name: stop.reasonName, category: stop.category, minutes: 0, count: 0 }
                reason.minutes += stop.minutes
                reason.count += 1
                reasons.set(stop.reasonId, reason)
            }
            const shots = Math.max(0, lot.actualShots ?? 0)
            report.reportedLotCount += 1
            report.grossMinutes += grossMinutes
            report.runMinutes += grossMinutes - stopped
            report.shots += shots
            report.idealMinutes += (lot.cycleTimeSec * shots) / 60
            report.goodQuantity += lot.goodQuantity
            report.scrapQuantity += lot.scrapQuantity
        }

        // Pasif makine yalnız pencerede üretimi ya da raporsuz vardiyası varsa listelenir.
        const active = time.productionMinutes > 0 || report.reportedLotCount > 0 || report.unreportedLotCount > 0
        if (machine.status === "INACTIVE" && !active) continue

        for (const key of ["capacityMinutes", "productionMinutes", "overtimeMinutes", "runMinutes", "idleMinutes"] as const) totalTime[key] += time[key]
        addInto(totalTime.stopMinutes, time.stopMinutes)
        addInto(totalTime.downtimeMinutes, time.downtimeMinutes)
        for (const key of ["reportedLotCount", "unreportedLotCount", "grossMinutes", "runMinutes", "shots", "idealMinutes", "goodQuantity", "scrapQuantity"] as const) {
            totalReport[key] += report[key]
        }
        addInto(totalReport.stopMinutes, report.stopMinutes)

        rows.push({ machineId: machine.id, code: machine.code, name: machine.name, areaCode: machine.areaCode, ...withRatios(time, report) })
    }

    const stopReasons = [...reasons.values()]
        .sort((a, b) => b.minutes - a.minutes || b.count - a.count || a.code.localeCompare(b.code, "tr"))
        .slice(0, input.topReasonCount ?? MACHINE_STATS_TOP_REASON_COUNT)

    return { rows, totals: withRatios(totalTime, totalReport), stopReasons }
}
