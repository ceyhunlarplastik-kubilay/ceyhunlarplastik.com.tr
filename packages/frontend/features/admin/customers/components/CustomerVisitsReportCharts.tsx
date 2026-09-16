"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { VISIT_OUTCOME_LABELS, VISIT_STATUS_LABELS } from "@/features/sales/visits/lib/visitLabels"
import type { CustomerVisitsReportSummary } from "@/features/admin/customers/api/types"

const STATUS_CHART_CONFIG: ChartConfig = {
    count: { label: "Ziyaret" },
    PLANNED: { label: VISIT_STATUS_LABELS.PLANNED, color: "var(--chart-3)" },
    COMPLETED: { label: VISIT_STATUS_LABELS.COMPLETED, color: "var(--chart-2)" },
    CANCELED: { label: VISIT_STATUS_LABELS.CANCELED, color: "var(--chart-5)" },
}

const OUTCOME_CHART_CONFIG: ChartConfig = {
    count: { label: "Ziyaret" },
    POSITIVE: { label: VISIT_OUTCOME_LABELS.POSITIVE, color: "var(--chart-2)" },
    ORDER_PLACED: { label: VISIT_OUTCOME_LABELS.ORDER_PLACED, color: "var(--chart-1)" },
    FOLLOW_UP_NEEDED: { label: VISIT_OUTCOME_LABELS.FOLLOW_UP_NEEDED, color: "var(--chart-4)" },
    NOT_INTERESTED: { label: VISIT_OUTCOME_LABELS.NOT_INTERESTED, color: "var(--chart-5)" },
}

type Props = {
    summary: CustomerVisitsReportSummary
}

/**
 * Ziyaret raporu grafikleri — kullanıcı talebiyle eklendi ("sonuç analizini
 * gösteren chart"). `summary` FİLTRELENMİŞ toplam üzerinden gelir (bkz.
 * backend `getVisitsReportSummary` — durum/sonuç filtresi HARİÇ diğer tüm
 * filtreler uygulanır), tek sayfadaki 20 kayda göre DEĞİL.
 */
export function CustomerVisitsReportCharts({ summary }: Props) {
    const statusData = (Object.keys(VISIT_STATUS_LABELS) as Array<keyof typeof VISIT_STATUS_LABELS>).map((status) => ({
        key: status,
        label: VISIT_STATUS_LABELS[status],
        count: summary.statusCounts[status],
    }))

    const outcomeData = (Object.keys(VISIT_OUTCOME_LABELS) as Array<keyof typeof VISIT_OUTCOME_LABELS>)
        .map((outcome) => ({
            key: outcome,
            label: VISIT_OUTCOME_LABELS[outcome],
            count: summary.outcomeCounts[outcome],
        }))
        .filter((item) => item.count > 0)
    const outcomeTotal = outcomeData.reduce((sum, item) => sum + item.count, 0)

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Durum Dağılımı</CardTitle>
                    <CardDescription>
                        Filtrelere uyan toplam {summary.total} ziyaret
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={STATUS_CHART_CONFIG} className="h-64 w-full">
                        <BarChart data={statusData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                            <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {statusData.map((entry) => (
                                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sonuç Dağılımı</CardTitle>
                    <CardDescription>
                        {outcomeTotal > 0
                            ? `Tamamlanan ${outcomeTotal} ziyaretin sonucu`
                            : "Henüz sonuçlandırılmış ziyaret yok"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {outcomeTotal > 0 ? (
                        <ChartContainer config={OUTCOME_CHART_CONFIG} className="mx-auto aspect-square h-64">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
                                <Pie data={outcomeData} dataKey="count" nameKey="key" innerRadius={52}>
                                    {outcomeData.map((entry) => (
                                        <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                            Henüz sonuçlandırılmış ziyaret yok.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
