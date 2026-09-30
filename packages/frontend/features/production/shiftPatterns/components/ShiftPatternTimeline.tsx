import {
    buildShiftTimeline,
    formatMinuteOfDay,
    MINUTES_PER_DAY,
    type NormalizedShiftDefinition,
} from "@core/helpers/production/shiftPatterns"
import { cn } from "@/lib/utils"

/** Vardiya sırasına göre renk — renk tek başına bilgi taşımaz, bloklarda kod yazılı. */
const SEGMENT_CLASSES = [
    "bg-sky-500/85 text-white dark:bg-sky-600/85",
    "bg-amber-500/85 text-white dark:bg-amber-600/85",
    "bg-violet-500/85 text-white dark:bg-violet-600/85",
    "bg-emerald-500/85 text-white dark:bg-emerald-600/85",
]

const TICK_EVERY_MINUTES = 4 * 60

/**
 * Bir vardiya gününün 24 saatlik şeridi: ilk vardiyanın başlangıcından itibaren.
 * Gece vardiyası (ertesi takvim gününe düşen) "+1" ile işaretlenir.
 */
export function ShiftPatternTimeline({
    shifts,
    className,
}: {
    shifts: NormalizedShiftDefinition[]
    className?: string
}) {
    const timeline = buildShiftTimeline(shifts)
    if (timeline.length === 0) return null

    const anchorStart = timeline[0].shift.startMinute - timeline[0].offsetStart
    const ticks = Array.from(
        { length: MINUTES_PER_DAY / TICK_EVERY_MINUTES + 1 },
        (_, index) => index * TICK_EVERY_MINUTES,
    )

    return (
        <div className={cn("space-y-1.5", className)}>
            <div
                className="relative h-9 overflow-hidden rounded-lg border bg-muted/60"
                role="img"
                aria-label={timeline
                    .map((entry) => `${entry.shift.code} ${formatMinuteOfDay(entry.shift.startMinute)}, ${entry.shift.durationMinutes / 60} saat`)
                    .join("; ")}
            >
                {timeline.map((entry, index) => (
                    <div
                        key={`${entry.shift.code}-${index}`}
                        className={cn(
                            "absolute inset-y-0 flex items-center justify-center overflow-hidden border-e border-background/60 px-1 text-[11px] font-semibold",
                            SEGMENT_CLASSES[index % SEGMENT_CLASSES.length],
                        )}
                        style={{
                            left: `${(entry.offsetStart / MINUTES_PER_DAY) * 100}%`,
                            width: `${(Math.min(entry.offsetEnd, MINUTES_PER_DAY) - entry.offsetStart) / MINUTES_PER_DAY * 100}%`,
                        }}
                        title={`${entry.shift.code} · ${entry.shift.name}`}
                    >
                        <span className="truncate">
                            {entry.shift.code}
                            {entry.startsNextDay ? <sup className="ms-0.5 font-normal">+1</sup> : null}
                        </span>
                    </div>
                ))}
            </div>
            <div className="relative h-4 text-[10px] text-muted-foreground" aria-hidden="true">
                {ticks.map((tick) => (
                    <span
                        key={tick}
                        className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                        style={{ left: `${(tick / MINUTES_PER_DAY) * 100}%` }}
                    >
                        {formatMinuteOfDay((anchorStart + tick) % MINUTES_PER_DAY)}
                    </span>
                ))}
            </div>
        </div>
    )
}
