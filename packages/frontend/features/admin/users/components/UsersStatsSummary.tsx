"use client"

import { cn } from "@/lib/utils"

type UsersStats = {
    purchasing: number
    sales: number
    suppliers: number
    customers: number
    dirty: number
    inactive: number
}

type Props = {
    visibleCount: number
    stats: UsersStats
}

function SummaryItem({
    label,
    value,
    tone = "neutral",
}: {
    label: string
    value: number
    tone?: "neutral" | "accent" | "warning"
}) {
    return (
        <div
            className={cn(
                "rounded-2xl border px-4 py-3",
                tone === "accent" && "border-sky-200 bg-sky-50/70",
                tone === "warning" && "border-amber-200 bg-amber-50/70",
                tone === "neutral" && "border-neutral-200 bg-white",
            )}
        >
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">{label}</div>
            <div className="mt-1.5 text-xl font-semibold text-neutral-950">{value}</div>
        </div>
    )
}

export function UsersStatsSummary({ visibleCount, stats }: Props) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryItem label="Görünen Kullanıcı" value={visibleCount} />
            <SummaryItem label="Portal Rolleri" value={stats.suppliers + stats.customers} tone="accent" />
            <SummaryItem label="Operasyon Ekipleri" value={stats.purchasing + stats.sales} />
            <SummaryItem label="Taslak Değişiklik" value={stats.dirty} tone={stats.dirty > 0 ? "warning" : "neutral"} />
            <SummaryItem label="Pasif Kullanıcı" value={stats.inactive} />
        </div>
    )
}
