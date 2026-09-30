import { addDaysToDateKey, enumerateDateKeys, weekdayOfDateKey } from "@core/helpers/production/productionCalendar"
import { wallTimeToUtc } from "@core/helpers/production/productionTime"
import { weekdayShortLabel } from "@core/helpers/production/shiftPatterns"
import type { BoardJob, BoardMachine, BoardPendingOrder, BoardShift } from "@/features/production/board/api/types"

/**
 * Planlama tahtasının SAF geometrisi: zaman → yüzde konum. Tüm anlar fabrika saatiyle
 * kurulmuş gerçek anlardır (sunucu verir); tarayıcının saat dilimi hiç kullanılmaz.
 */

/** Pencere seçenekleri (gün) ve gün başına piksel — kısa pencere daha ayrıntılı çizilir. */
export const BOARD_WINDOW_OPTIONS = [3, 7, 14, 28] as const
export const DEFAULT_BOARD_WINDOW_DAYS = 7
const PX_PER_DAY: Record<number, number> = { 3: 480, 7: 220, 14: 120, 28: 64 }

export function normalizeWindowDays(days: number): number {
    return (BOARD_WINDOW_OPTIONS as readonly number[]).includes(days) ? days : DEFAULT_BOARD_WINDOW_DAYS
}

export function boardPixelsPerDay(days: number): number {
    return PX_PER_DAY[normalizeWindowDays(days)]
}

/** `from` + gün sayısı → iki uç dahil pencere. */
export function boardWindow(from: string, days: number): { from: string; to: string } {
    return { from, to: addDaysToDateKey(from, normalizeWindowDays(days) - 1) }
}

export type TimeSpan = { startMs: number; endMs: number }

export function toSpan(startAt: string | Date, endAt: string | Date): TimeSpan {
    return { startMs: new Date(startAt).getTime(), endMs: new Date(endAt).getTime() }
}

/** Aralığın penceredeki yeri (% olarak, pencereye kırpılmış); pencere dışındaysa `null`. */
export function spanPercent(range: TimeSpan, span: TimeSpan): { left: number; width: number } | null {
    const total = range.endMs - range.startMs
    const start = Math.max(span.startMs, range.startMs)
    const end = Math.min(span.endMs, range.endMs)
    if (total <= 0 || end <= start) return null
    return { left: ((start - range.startMs) / total) * 100, width: ((end - start) / total) * 100 }
}

/** Anın penceredeki yeri (%); pencere dışındaysa `null`. */
export function instantPercent(range: TimeSpan, instant: Date | string): number | null {
    const ms = new Date(instant).getTime()
    if (ms < range.startMs || ms > range.endMs) return null
    return ((ms - range.startMs) / (range.endMs - range.startMs)) * 100
}

/** Vardiya DIŞI kalan parçalar (çalışılmayan zaman) — vardiyalar arasındaki boşluklar. */
export function offShiftSpans(range: TimeSpan, shifts: BoardShift[]): TimeSpan[] {
    const sorted = shifts.map((shift) => toSpan(shift.startAt, shift.endAt)).sort((a, b) => a.startMs - b.startMs)
    const gaps: TimeSpan[] = []
    let cursor = range.startMs
    for (const shift of sorted) {
        if (shift.startMs > cursor) gaps.push({ startMs: cursor, endMs: Math.min(shift.startMs, range.endMs) })
        cursor = Math.max(cursor, shift.endMs)
        if (cursor >= range.endMs) break
    }
    if (cursor < range.endMs) gaps.push({ startMs: cursor, endMs: range.endMs })
    return gaps.filter((gap) => gap.endMs > gap.startMs)
}

export type BoardDay = TimeSpan & { date: string; label: string; weekday: string; isSunday: boolean }

/** Başlık sütunları: fabrika gün başından ertesi gün başına. */
export function boardDays(from: string, to: string): BoardDay[] {
    return enumerateDateKeys(from, to).map((date) => {
        const start = wallTimeToUtc(`${date}T00:00`) as Date
        const end = wallTimeToUtc(`${addDaysToDateKey(date, 1)}T00:00`) as Date
        const weekday = weekdayOfDateKey(date)
        return {
            date,
            startMs: start.getTime(),
            endMs: end.getTime(),
            label: `${date.slice(8, 10)}.${date.slice(5, 7)}`,
            weekday: weekdayShortLabel(weekday),
            isSunday: weekday === 7,
        }
    })
}

export type JobSegment = TimeSpan & { kind: "setup" } | TimeSpan & { kind: "lot"; lotNumber: string; shiftCode: string; plannedShots: number }

/** İşin çizilen parçaları: bağlama + vardiya lotları (aradaki vardiya dışı zaman boş kalır). */
export function jobSegments(job: BoardJob): JobSegment[] {
    const segments: JobSegment[] = []
    const setup = toSpan(job.setupStartAt, job.productionStartAt)
    if (setup.endMs > setup.startMs) segments.push({ ...setup, kind: "setup" })
    for (const lot of job.lots) {
        segments.push({
            ...toSpan(lot.plannedStartAt, lot.plannedEndAt),
            kind: "lot",
            lotNumber: lot.lotNumber,
            shiftCode: lot.shiftCode,
            plannedShots: lot.plannedShots,
        })
    }
    return segments
}

export type BoardAreaGroup = { area: BoardMachine["area"]; machines: BoardMachine[] }

/** Makineleri (sunucunun alan sırasını koruyarak) alanlara gruplar; `areaId` verilirse süzer. */
export function groupMachinesByArea(machines: BoardMachine[], areaId?: string | null): BoardAreaGroup[] {
    const groups: BoardAreaGroup[] = []
    for (const machine of machines) {
        if (areaId && machine.area.id !== areaId) continue
        const last = groups[groups.length - 1]
        if (last && last.area.id === machine.area.id) last.machines.push(machine)
        else groups.push({ area: machine.area, machines: [machine] })
    }
    return groups
}

/** Çubuk etiketi: "1000 · UE-1001 · 10.1.3.V1" (emri silinmişse kalıp kodu). */
export function jobLabel(job: BoardJob): string {
    const order = job.outputs.find((output) => output.order)?.order
    return order ? `${job.lotBaseNumber} · ${order.orderNumber} · ${order.variantCode}` : `${job.lotBaseNumber} · ${job.mold.code}`
}

/** Sürüklemede zaman adımı. */
export const BOARD_SNAP_MINUTES = 15
const SNAP_MS = BOARD_SNAP_MINUTES * 60_000

/**
 * Yatay sürükleme mesafesi → istenen yeni bağlama başı (15 dk'ya yuvarlı). Türkiye'nin UTC
 * farkı tam saat olduğu için UTC'de çeyreğe yuvarlamak fabrika saatinde de çeyrek verir.
 */
export function draggedStartAt(input: { setupStartAt: string; deltaXPx: number; timelineWidthPx: number; range: TimeSpan }): Date {
    const msPerPx = (input.range.endMs - input.range.startMs) / input.timelineWidthPx
    const raw = new Date(input.setupStartAt).getTime() + input.deltaXPx * msPerPx
    return new Date(Math.round(raw / SNAP_MS) * SNAP_MS)
}

export type MoveVerdict = "same" | "ok" | "warning" | "unknown" | "error"

/** Sürüklenen çubuğun üstündeki etiket ("M-02 · 29.09 08:15") ve hükmü. */
export type DragPreview = { label: string; verdict: MoveVerdict }

/** Hedef satır için taşıma hükmü — satır rengi ve bırakma kararı buradan. */
export function moveVerdict(job: BoardJob, machineId: string): { verdict: MoveVerdict; reason: string | null } {
    if (machineId === job.machineId) return { verdict: "same", reason: null }
    const fit = job.machineFit.find((entry) => entry.machineId === machineId)
    if (!fit) return { verdict: "unknown", reason: null }
    return { verdict: fit.verdict, reason: fit.reason }
}

/** Bekleyen emir kartı için hedef satır hükmü (emrin en uygun kalıbına göre). */
export function orderDropVerdict(order: BoardPendingOrder, machineId: string): { verdict: MoveVerdict; reason: string | null } {
    const fit = order.machineFit.find((entry) => entry.machineId === machineId)
    if (!fit) return { verdict: "unknown", reason: null }
    return { verdict: fit.verdict, reason: fit.verdict === "error" ? "emrin kalıplarından hiçbiri bu makinede çalışmıyor" : null }
}

/**
 * Satıra bırakılan kartın başlangıcı: imlecin satır içindeki yatay konumu → zaman (15 dk'ya
 * yuvarlı, pencereye kıstırılmış). Emir kartı panelden geldiği için mesafe değil KONUM kullanılır.
 */
export function pointerStartAt(input: { clientX: number; rectLeft: number; rectWidth: number; range: TimeSpan }): Date {
    const ratio = Math.min(1, Math.max(0, (input.clientX - input.rectLeft) / input.rectWidth))
    const raw = input.range.startMs + ratio * (input.range.endMs - input.range.startMs)
    return new Date(Math.round(raw / SNAP_MS) * SNAP_MS)
}

export function isJobMovable(job: BoardJob): boolean {
    return job.status === "PLANNED"
}
