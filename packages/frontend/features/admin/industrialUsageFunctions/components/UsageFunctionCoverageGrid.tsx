"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { IndustrialUsageFunctionRow } from "@/features/admin/industrialUsageFunctions/api/types"
import {
    ADMIN_LOCALE_LABELS,
    adminLocaleFlag,
} from "@/features/admin/shared/translations/adminLocales"
import { orderedLocales } from "@/features/admin/industrialUsageFunctions/lib/usageFunctionWorkbookFormat"

type Props = {
    rows: IndustrialUsageFunctionRow[]
}

/**
 * "Hangi dilde ne kadar eksik?" — dosyayı göndermeden önce ve içe aktardıktan
 * sonra bakılan tek ekran. Yüzde yerine ham sayı: eksik 3 satır, %98'den daha
 * anlaşılır bir iş listesidir.
 */
export function UsageFunctionCoverageGrid({ rows }: Props) {
    const coverage = useMemo(
        () =>
            orderedLocales().map((locale) => {
                const filled = rows.filter((row) => row.usageFunctions[locale]?.trim()).length

                return {
                    locale,
                    filled,
                    missing: rows.length - filled,
                }
            }),
        [rows],
    )

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {coverage.map(({ locale, filled, missing }) => {
                const isComplete = missing === 0 && rows.length > 0

                return (
                    <div
                        key={locale}
                        className={cn(
                            "rounded-2xl border px-3 py-2.5",
                            isComplete
                                ? "border-emerald-200 bg-emerald-50/60"
                                : "border-neutral-200 bg-white",
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-medium text-neutral-600">
                                <span aria-hidden className="me-1">
                                    {adminLocaleFlag(locale)}
                                </span>
                                {ADMIN_LOCALE_LABELS[locale]}
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full px-1.5 text-[10px]",
                                    isComplete
                                        ? "border-emerald-200 text-emerald-700"
                                        : "border-neutral-200 text-neutral-500",
                                )}
                            >
                                {locale}
                            </Badge>
                        </div>

                        <div className="mt-1.5 text-sm font-semibold text-neutral-950">
                            {filled} / {rows.length}
                        </div>
                        <div
                            className={cn(
                                "text-[11px] font-medium",
                                isComplete ? "text-emerald-700" : "text-amber-600",
                            )}
                        >
                            {isComplete ? "tamam" : `${missing} eksik`}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
