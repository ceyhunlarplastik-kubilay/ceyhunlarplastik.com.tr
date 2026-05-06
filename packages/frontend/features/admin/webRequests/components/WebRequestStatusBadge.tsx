"use client"

import { Badge } from "@/components/ui/badge"

export const WEB_REQUEST_STATUS_LABELS: Record<string, string> = {
    NEW: "Yeni",
    CONTACTED: "İletişime Geçildi",
    IN_PROGRESS: "İşlemde",
    CLOSED: "Kapatıldı",
}

const WEB_REQUEST_STATUS_CLASSES: Record<string, string> = {
    NEW: "border-sky-200 bg-sky-50 text-sky-700",
    CONTACTED: "border-amber-200 bg-amber-50 text-amber-700",
    IN_PROGRESS: "border-violet-200 bg-violet-50 text-violet-700",
    CLOSED: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

type Props = {
    status: string
}

export function WebRequestStatusBadge({ status }: Props) {
    return (
        <Badge
            variant="outline"
            className={WEB_REQUEST_STATUS_CLASSES[status] ?? "border-neutral-200 bg-neutral-50 text-neutral-700"}
        >
            {WEB_REQUEST_STATUS_LABELS[status] ?? status}
        </Badge>
    )
}
