import { Badge } from "@/components/ui/badge"

const STATUS_LABELS = {
    PENDING_REVIEW: "İnceleniyor",
    ACTIVE: "Aktif",
    SUSPENDED: "Askıya alındı",
    REJECTED: "Reddedildi",
} as const

const STATUS_CLASSES = {
    PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700",
    REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
} as const

export function UserAccessStatusBadge({
    status,
}: {
    status: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
}) {
    return (
        <Badge
            variant="outline"
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_CLASSES[status] ?? "border-neutral-200 bg-neutral-50 text-neutral-700"}`}
        >
            {STATUS_LABELS[status] ?? status}
        </Badge>
    )
}
