"use client"

import { Star, ThumbsUp } from "lucide-react"

import type { CompatibilityCell, CompatibilityRow } from "@/features/production/compatibility/lib/buildCompatibilityMatrix"
import { COMPATIBILITY_LEVEL_META } from "@/features/production/compatibility/lib/compatibilityPresentation"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import { cn } from "@/lib/utils"

function describeMold(row: CompatibilityRow) {
    const { mold, shotWeightG } = row
    return [
        mold.requiredClampForceTon != null ? `${mold.requiredClampForceTon} t` : null,
        shotWeightG != null ? `${shotWeightG.toLocaleString("tr-TR")} g` : null,
        mold.thicknessMm != null ? `${mold.thicknessMm} mm` : null,
    ].filter(Boolean).join(" · ")
}

function MatrixCellButton({
    row,
    cell,
    onSelect,
}: {
    row: CompatibilityRow
    cell: CompatibilityCell
    onSelect: () => void
}) {
    const meta = COMPATIBILITY_LEVEL_META[cell.result.verdict]
    const Icon = meta.icon
    const utilization = cell.result.clampUtilization

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-label={`${row.mold.code} × ${cell.machine.code}: ${meta.label}${cell.isRecommended ? ", önerilen" : ""}${cell.result.isPreferred ? ", tercih edilen" : ""}`}
            className={cn(
                "inline-flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs transition-colors",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                cell.isRecommended && "bg-emerald-50 ring-2 ring-emerald-500/60 dark:bg-emerald-950/40",
            )}
        >
            <span className="flex items-center gap-0.5">
                <Icon className={cn("h-5 w-5", meta.className)} aria-hidden />
                {cell.isRecommended ? <Star className="h-3 w-3 fill-emerald-500 text-emerald-600" aria-hidden /> : null}
                {cell.result.isPreferred ? <ThumbsUp className="h-3 w-3 text-sky-600" aria-hidden /> : null}
            </span>
            <span className="tabular-nums text-muted-foreground">
                {utilization != null ? `%${Math.round(utilization * 100)}` : "—"}
            </span>
        </button>
    )
}

/**
 * Kalıp satırı × makine sütunu. shadcn `Table` kabı kendi yatay kaydırma kutusunu
 * kurduğu için yapışkan başlık + yapışkan ilk sütun için tablo burada doğrudan kurulur:
 * kaydırma kabı tek (iki eksen), başlık üstte, kalıp sütunu solda sabit kalır.
 */
export function CompatibilityMatrixTable({
    machines,
    rows,
    onSelect,
}: {
    machines: ProductionMachine[]
    rows: CompatibilityRow[]
    onSelect: (row: CompatibilityRow, cell: CompatibilityCell) => void
}) {
    return (
        <div className="max-h-[70vh] overflow-auto rounded-2xl border bg-card">
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                <caption className="sr-only">
                    Kalıp × makine uygunluk matrisi. Hücreye basınca kontrollerin ayrıntısı açılır.
                </caption>
                <thead>
                    <tr>
                        <th
                            scope="col"
                            className="sticky start-0 top-0 z-30 min-w-40 border-b border-e bg-card px-3 py-2 text-start font-medium sm:min-w-56"
                        >
                            Kalıp
                        </th>
                        {machines.map((machine) => (
                            <th
                                key={machine.id}
                                scope="col"
                                className="sticky top-0 z-20 min-w-20 border-b bg-card px-2 py-2 text-center font-medium"
                                title={machine.name}
                            >
                                <div>{machine.code}</div>
                                <div className="text-xs font-normal text-muted-foreground">
                                    {machine.clampForceTon} t · {machine.area.code}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.mold.id}>
                            <th
                                scope="row"
                                className="sticky start-0 z-10 border-b border-e bg-card px-3 py-2 text-start align-top font-normal"
                            >
                                <div className="font-medium">{row.mold.code}</div>
                                <div className="max-w-36 truncate text-xs text-muted-foreground sm:max-w-52" title={row.mold.name}>
                                    {row.mold.name}
                                </div>
                                <div className="text-xs text-muted-foreground">{describeMold(row) || "Teknik değer yok"}</div>
                                <div
                                    className={cn(
                                        "text-xs",
                                        row.usableCount === 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
                                    )}
                                >
                                    {row.usableCount === 0 ? "Uygun makine yok" : `${row.usableCount} makinede çalışır`}
                                </div>
                            </th>
                            {row.cells.map((cell) => (
                                <td key={cell.machine.id} className="border-b px-1 py-1 text-center align-middle">
                                    <MatrixCellButton row={row} cell={cell} onSelect={() => onSelect(row, cell)} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
