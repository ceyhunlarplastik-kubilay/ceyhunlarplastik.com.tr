import type {
    CustomerVisitOutcome,
    CustomerVisitStatus,
    CustomerVisitType,
} from "@/features/admin/customers/api/types"

export const VISIT_STATUS_LABELS: Record<CustomerVisitStatus, string> = {
    PLANNED: "Planlandı",
    COMPLETED: "Tamamlandı",
    CANCELED: "İptal",
}

export const VISIT_STATUS_STYLES: Record<CustomerVisitStatus, string> = {
    PLANNED: "bg-sky-100 text-sky-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELED: "bg-neutral-200 text-neutral-600",
}

export const VISIT_TYPE_LABELS: Record<CustomerVisitType, string> = {
    IN_PERSON: "Yüz Yüze",
    PHONE: "Telefon",
    VIDEO: "Video",
}

export const VISIT_OUTCOME_LABELS: Record<CustomerVisitOutcome, string> = {
    POSITIVE: "Olumlu",
    FOLLOW_UP_NEEDED: "Takip Gerekiyor",
    NOT_INTERESTED: "İlgilenmiyor",
    ORDER_PLACED: "Sipariş Alındı",
}

export const VISIT_OUTCOME_STYLES: Record<CustomerVisitOutcome, string> = {
    POSITIVE: "bg-emerald-100 text-emerald-800",
    FOLLOW_UP_NEEDED: "bg-amber-100 text-amber-900",
    NOT_INTERESTED: "bg-red-100 text-red-800",
    ORDER_PLACED: "bg-violet-100 text-violet-800",
}
