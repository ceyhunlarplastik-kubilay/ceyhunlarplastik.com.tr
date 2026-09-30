import { LOT_STARTABLE_JOB_STATUSES } from "@core/helpers/production/lotReports"
import type { LotListItem } from "@/features/production/lots/api/types"

/** Ekranda gösterilen lot durumu: raporsuz kapanan lot (iş tamamlanırken) ayrı görünür. */
export type LotDisplayStatus = "PLANNED" | "RUNNING" | "REPORTED" | "CLOSED_UNREPORTED" | "CANCELLED"

export function lotDisplayStatus(lot: Pick<LotListItem, "status" | "reportedAt">): LotDisplayStatus {
    if (lot.status === "COMPLETED") return lot.reportedAt ? "REPORTED" : "CLOSED_UNREPORTED"
    return lot.status
}

export const LOT_DISPLAY_STATUS_LABELS: Record<LotDisplayStatus, string> = {
    PLANNED: "Planlı",
    RUNNING: "Üretimde",
    REPORTED: "Raporlandı",
    CLOSED_UNREPORTED: "Raporsuz kapandı",
    CANCELLED: "İptal",
}

export const LOT_DISPLAY_STATUS_CLASSES: Record<LotDisplayStatus, string> = {
    PLANNED: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    RUNNING: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    REPORTED: "border-border bg-muted text-foreground",
    CLOSED_UNREPORTED: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    CANCELLED: "border-border bg-muted text-muted-foreground",
}

/** Sunucu da aynı kuralı uygular; burada yalnız düğmeyi göstermek için. */
export function canStartLot(lot: Pick<LotListItem, "status" | "job">): boolean {
    return lot.status === "PLANNED" && LOT_STARTABLE_JOB_STATUSES.includes(lot.job.status)
}

/** Rapor girilebilir / düzeltilebilir: iş sahaya verilmiş ve kapanmamış. */
export function canReportLot(lot: Pick<LotListItem, "status" | "job">): boolean {
    return LOT_STARTABLE_JOB_STATUSES.includes(lot.job.status) && lot.status !== "CANCELLED"
}

export function lotTotals(lot: Pick<LotListItem, "outputs">) {
    return lot.outputs.reduce(
        (sum, output) => ({ good: sum.good + output.goodQuantity, scrap: sum.scrap + output.scrapQuantity }),
        { good: 0, scrap: 0 },
    )
}
