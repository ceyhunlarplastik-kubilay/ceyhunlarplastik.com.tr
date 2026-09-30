"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { BoardJob } from "@/features/production/board/api/types"
import { boardAlerts, describeForecast, describeMaintenance } from "@/features/production/board/utils/boardForecast"

/** Kapalıyken bu kadar uyarı; fazlası "daha fazla" ile açılır. */
const COLLAPSED_LIMIT = 6

type Props = {
    jobs: BoardJob[]
    machineCode: (machineId: string) => string
    onSelectJob: (job: BoardJob) => void
}

/**
 * Tahtanın uyarı şeridi (4.3): penceredeki geciken / termin riskli işler (tıklayınca ayrıntı açılır)
 * ve bakımı yaklaşan / gelen ya da planlı işlerle aşılacak kalıplar (kalıplar sayfasına gider).
 */
export function BoardAlertsPanel({ jobs, machineCode, onSelectJob }: Props) {
    const [expanded, setExpanded] = useState(false)
    const { lateJobs, maintenanceMolds } = useMemo(() => boardAlerts(jobs), [jobs])
    const items = [
        ...lateJobs.map((job) => ({ kind: "job" as const, key: job.id, job })),
        ...maintenanceMolds.map((entry) => ({ kind: "mold" as const, key: entry.mold.id, ...entry })),
    ]
    if (items.length === 0) return null

    const visible = expanded ? items : items.slice(0, COLLAPSED_LIMIT)
    const summary = [
        lateJobs.length > 0 ? `${lateJobs.length} geciken / riskli iş` : null,
        maintenanceMolds.length > 0 ? `${maintenanceMolds.length} kalıp bakımı` : null,
    ].filter(Boolean).join(" · ")
    const itemClassName = "flex w-full min-w-0 items-start gap-2 rounded-lg px-2 py-1 text-start hover:bg-amber-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-amber-900/40"

    return (
        <section aria-label="Uyarılar" className="rounded-2xl border border-amber-300 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/70 dark:bg-amber-950/30">
            <h2 className="flex flex-wrap items-center gap-x-2 px-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Uyarılar
                <span className="font-normal text-amber-900/80 dark:text-amber-200/80">{summary} — bu penceredeki işlerden</span>
            </h2>
            <ul className="mt-1.5 grid gap-0.5 text-sm lg:grid-cols-2">
                {visible.map((item) => (
                    <li key={`${item.kind}:${item.key}`} className="min-w-0">
                        {item.kind === "job" ? (
                            <button type="button" className={itemClassName} onClick={() => onSelectJob(item.job)}>
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                                <span className="min-w-0">
                                    <span className="font-medium">İş {item.job.lotBaseNumber} · {machineCode(item.job.machineId)}</span>
                                    {" — "}{describeForecast(item.job.forecast)}
                                </span>
                            </button>
                        ) : (
                            <Link href={`/uretim/kaliplar?q=${encodeURIComponent(item.mold.code)}`} className={itemClassName}>
                                <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
                                <span className="min-w-0">
                                    <span className="font-medium">Kalıp {item.mold.code}</span>
                                    {" — "}{describeMaintenance(item.status)}
                                </span>
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
            {items.length > COLLAPSED_LIMIT ? (
                <Button type="button" variant="link" size="sm" className="h-auto px-2 py-1" onClick={() => setExpanded((value) => !value)}>
                    {expanded ? "Daha az göster" : `${items.length - COLLAPSED_LIMIT} uyarı daha`}
                </Button>
            ) : null}
        </section>
    )
}
