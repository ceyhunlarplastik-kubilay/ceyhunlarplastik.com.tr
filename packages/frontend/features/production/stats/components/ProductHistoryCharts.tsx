"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import type { ProductHistoryRow } from "@/features/production/stats/api/types"
import { CHART_ROW_LIMIT, productHistoryChartData } from "@/features/production/stats/lib/productHistoryFormat"

const QUANTITY_CONFIG: ChartConfig = {
    good: { label: "Sağlam", color: "var(--chart-2)" },
    scrap: { label: "Fire", color: "var(--chart-5)" },
}

const CYCLE_CONFIG: ChartConfig = {
    planned: { label: "Plan çevrim (sn)", color: "var(--chart-3)" },
    actual: { label: "Gerçek çevrim (sn)", color: "var(--chart-1)" },
}

/** Üretim başına sağlam / fire ve iş başına plan ↔ gerçek çevrim (en yeni en fazla 40 üretim). */
export function ProductHistoryCharts({ rows }: { rows: ProductHistoryRow[] }) {
    const { quantities, cycles, limited } = productHistoryChartData(rows)
    const scope = limited ? `En yeni ${CHART_ROW_LIMIT} üretim, eskiden yeniye.` : "Eskiden yeniye."

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-base">Sağlam / fire</CardTitle>
                    <CardDescription>Üretim (iş) başına adet. {scope}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={QUANTITY_CONFIG} className="h-64 w-full">
                        <BarChart data={quantities} margin={{ left: 4, right: 4 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => value.toLocaleString("tr-TR")} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
                            <Bar dataKey="good" stackId="count" fill="var(--color-good)" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="scrap" stackId="count" fill="var(--color-scrap)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-base">Çevrim: plan ↔ gerçekleşen</CardTitle>
                    <CardDescription>
                        Gerçekleşen = raporlu vardiyalarda (süre − duruş) ÷ baskı. {cycles.length === 0 ? "Henüz raporlu baskı yok." : scope}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={CYCLE_CONFIG} className="h-64 w-full">
                        <LineChart data={cycles} margin={{ left: 4, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                            <YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
                            <Line dataKey="planned" type="stepAfter" stroke="var(--color-planned)" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                            <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
