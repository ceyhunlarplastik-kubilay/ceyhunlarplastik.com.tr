import { formatDateKey, weekdayOfDateKey } from "@core/helpers/production/productionCalendar"
import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import { weekdayShortLabel } from "@core/helpers/production/shiftPatterns"
import type { LotListItem, LotOutput } from "@/features/production/lots/api/types"

/** "28.09.2026 Pzt · A" — vardiya GÜNÜ (gece vardiyası o güne ait). */
export function formatLotShiftDay(lot: Pick<LotListItem, "shiftDate" | "shiftCode">): string {
    return `${formatDateKey(lot.shiftDate)} ${weekdayShortLabel(weekdayOfDateKey(lot.shiftDate))} · ${lot.shiftCode}`
}

/** "08:00–16:00" (fabrika saati; bitiş ertesi güne taşarsa da yalnız saat). */
export function formatLotTimeRange(lot: Pick<LotListItem, "plannedStartAt" | "plannedEndAt">): string {
    return `${formatProductionShortDateTime(lot.plannedStartAt).slice(6)}–${formatProductionShortDateTime(lot.plannedEndAt).slice(6)}`
}

export function lotPlannedQuantity(outputs: Pick<LotOutput, "plannedQuantity">[]): number {
    return outputs.reduce((sum, output) => sum + output.plannedQuantity, 0)
}

/** Detay sayfası adresi — QR da bunu taşır. */
export function lotDetailPath(lotNumber: string): string {
    return `/uretim/lotlar/${encodeURIComponent(lotNumber)}`
}
