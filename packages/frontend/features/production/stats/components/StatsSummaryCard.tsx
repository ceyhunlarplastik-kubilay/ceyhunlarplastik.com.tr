import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const WARNING = "text-amber-700 dark:text-amber-400"

/** İstatistik sayfalarının özet kartı: etiket, büyük değer, kısa açıklama (tonları ayrı). */
export function StatsSummaryCard({
    label,
    value,
    hint,
    tone,
    hintTone,
}: {
    label: string
    value: ReactNode
    hint?: ReactNode
    tone?: "warning"
    hintTone?: "warning"
}) {
    return (
        <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className={cn("mt-1 text-xl font-semibold tabular-nums", tone === "warning" && WARNING)}>{value}</div>
            {hint ? <p className={cn("mt-1 text-xs text-muted-foreground", hintTone === "warning" && WARNING)}>{hint}</p> : null}
        </div>
    )
}
