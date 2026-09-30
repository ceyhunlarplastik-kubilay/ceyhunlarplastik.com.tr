"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { STOP_CATEGORY_LABELS } from "@core/helpers/production/productionReasons"
import type { MachineStatsRow, StopReasonTotal } from "@/features/production/stats/api/types"
import { formatHours, machineTimeChartData } from "@/features/production/stats/lib/machineStatsFormat"

const TIME_CONFIG: ChartConfig = {
    run: { label: "Net çalışma", color: "var(--chart-2)" },
    plannedStop: { label: "Planlı duruş", color: "var(--chart-3)" },
    unplannedStop: { label: "Plansız duruş", color: "var(--chart-1)" },
    downtime: { label: "Makine duruşu", color: "var(--chart-4)" },
    // Açık gri: açıklama kutucuğu ve ipucu da çubukla aynı rengi göstersin.
    idle: { label: "Boş", color: "color-mix(in oklab, var(--muted-foreground) 35%, transparent)" },
}

/** Makine başına saat: vardiya süresi nereye gitti (üretim → net / duruş, makine duruşu, boş). */
function MachineTimeChart({ rows }: { rows: MachineStatsRow[] }) {
    const data = machineTimeChartData(rows)
    const height = Math.max(200, data.length * 36 + 72)
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle className="text-base">Zaman dağılımı (saat)</CardTitle>
                <CardDescription>
                    Vardiya süresi: üretim (rapordaki oranla net çalışma ve duruşlar), makine duruşu, boş. Vardiya dışı üretim varsa çubuk vardiya süresini aşar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={TIME_CONFIG} className="w-full" style={{ height }}>
                    <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value: number) => value.toLocaleString("tr-TR")} />
                        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={64} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {/* Recharts 3 açıklamayı ada göre sıralar; çubuk sırası korunsun. */}
                        <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />} itemSorter={null} />
                        <Bar dataKey="run" stackId="time" fill="var(--color-run)" radius={[4, 0, 0, 4]} />
                        <Bar dataKey="plannedStop" stackId="time" fill="var(--color-plannedStop)" />
                        <Bar dataKey="unplannedStop" stackId="time" fill="var(--color-unplannedStop)" />
                        <Bar dataKey="downtime" stackId="time" fill="var(--color-downtime)" />
                        <Bar dataKey="idle" stackId="time" fill="var(--color-idle)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

/** En çok süre kaybettiren duruş nedenleri — sıralı liste, çubuk en uzun nedene göre. */
export function StopReasonList({ reasons }: { reasons: StopReasonTotal[] }) {
    const longest = Math.max(0, ...reasons.map((reason) => reason.minutes))
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle className="text-base">Duruş nedenleri</CardTitle>
                <CardDescription>Vardiya raporlarında en çok süre kaybettiren {reasons.length > 0 ? reasons.length : ""} neden.</CardDescription>
            </CardHeader>
            <CardContent>
                {reasons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bu aralıktaki raporlarda duruş yok.</p>
                ) : (
                    <ol className="space-y-3">
                        {reasons.map((reason) => (
                            <li key={reason.reasonId} className="space-y-1">
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate">
                                        <span className="font-medium tabular-nums">{reason.code}</span> · {reason.name}
                                        <span className="ms-2 text-xs text-muted-foreground">{STOP_CATEGORY_LABELS[reason.category]}</span>
                                    </span>
                                    <span className="shrink-0 tabular-nums text-muted-foreground">
                                        {formatHours(reason.minutes)} · {reason.count} kez
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted" aria-hidden>
                                    <div
                                        className={cn("h-full rounded-full", reason.category === "PLANNED" ? "bg-chart-3" : "bg-chart-1")}
                                        style={{ width: `${longest > 0 ? Math.max(2, (reason.minutes / longest) * 100) : 0}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </CardContent>
        </Card>
    )
}

export function MachineStatsCharts({ rows, stopReasons }: { rows: MachineStatsRow[]; stopReasons: StopReasonTotal[] }) {
    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <MachineTimeChart rows={rows} />
            <StopReasonList reasons={stopReasons} />
        </div>
    )
}
