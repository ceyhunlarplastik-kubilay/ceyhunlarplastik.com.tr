"use client"

import Link from "next/link"
import { Boxes, Factory, Star, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { CompatibilityCell, CompatibilityRow } from "@/features/production/compatibility/lib/buildCompatibilityMatrix"
import { COMPATIBILITY_LEVEL_META } from "@/features/production/compatibility/lib/compatibilityPresentation"
import { cn } from "@/lib/utils"

export type CompatibilitySelection = { row: CompatibilityRow; cell: CompatibilityCell }

/**
 * Tek hücrenin ayrıntısı: hangi kontrol neden geçti / kaldı; eksik bilgi nereden girilir.
 * `open` seçimden ayrıdır: kapanış animasyonu sürerken son seçim ekranda kalır.
 */
export function CompatibilityDetailDialog({
    open,
    selection,
    onOpenChange,
}: {
    open: boolean
    selection: CompatibilitySelection | null
    onOpenChange: (open: boolean) => void
}) {
    const verdict = selection ? COMPATIBILITY_LEVEL_META[selection.cell.result.verdict] : null
    const VerdictIcon = verdict?.icon

    return (
        <Dialog open={open && Boolean(selection)} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 rounded-3xl p-0 sm:max-w-lg">
                {selection && verdict && VerdictIcon ? (
                    <>
                        <DialogHeader className="border-b p-5 text-start">
                            <DialogTitle>
                                {selection.row.mold.code} × {selection.cell.machine.code}
                            </DialogTitle>
                            <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className={cn("inline-flex items-center gap-1 font-medium", verdict.className)}>
                                    <VerdictIcon className="h-4 w-4" aria-hidden />
                                    {verdict.label}
                                </span>
                                {selection.cell.isRecommended ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                        <Star className="h-3.5 w-3.5 fill-emerald-500" aria-hidden />
                                        Önerilen makine
                                    </span>
                                ) : null}
                                {selection.cell.result.isPreferred ? (
                                    <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400">
                                        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                                        Kalıp kartında tercih edilen
                                    </span>
                                ) : null}
                            </DialogDescription>
                        </DialogHeader>

                        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5 text-sm">
                            {selection.cell.result.checks.map((check) => {
                                const meta = COMPATIBILITY_LEVEL_META[check.level]
                                const Icon = meta.icon
                                return (
                                    <li key={check.code} className="flex gap-3">
                                        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.className)} aria-label={meta.label} />
                                        <div className="min-w-0">
                                            <div className="font-medium">{check.label}</div>
                                            <div className="text-muted-foreground">{check.message}</div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>

                        <div className="flex flex-wrap gap-2 border-t p-4">
                            <Button asChild variant="outline" size="sm" className="rounded-2xl">
                                <Link href={`/uretim/kaliplar?q=${encodeURIComponent(selection.row.mold.code)}`}>
                                    <Boxes className="h-4 w-4" />
                                    Kalıbı aç
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="rounded-2xl">
                                <Link href={`/uretim/makineler?q=${encodeURIComponent(selection.cell.machine.code)}`}>
                                    <Factory className="h-4 w-4" />
                                    Makineyi aç
                                </Link>
                            </Button>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
