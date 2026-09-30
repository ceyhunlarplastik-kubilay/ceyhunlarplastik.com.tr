"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ChartGantt, Tags } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDurationMinutes } from "@core/helpers/production/productionTime"
import { useProductionLot } from "@/features/production/lots/hooks/useProductionLots"
import { formatLotShiftDay, formatLotTimeRange, lotDetailPath, lotPlannedQuantity } from "@/features/production/lots/utils/lotFormat"
import { JobStatusBadge } from "@/features/production/shared/components/JobStatusBadge"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { LotDisplayStatusBadge } from "./LotDisplayStatusBadge"
import { LotLabelDialog } from "./LotLabelDialog"
import { LotNotesSection } from "./LotNotesSection"
import { LotReportDialog } from "./LotReportDialog"
import { LotReportSection } from "./LotReportSection"
import { LotOperatorsSection } from "./LotOperatorsSection"

/** Lot ayrıntısı: vardiya, çıktılar, aynı işin diğer lotları, ekip, notlar, etiket. */
export function ProductionLotDetailPageClient({ lotNumber }: { lotNumber: string }) {
    const lotQuery = useProductionLot(lotNumber)
    const lot = lotQuery.data
    const [reporting, setReporting] = useState(false)

    if (lotQuery.isLoading) return <Skeleton className="h-96 rounded-2xl" />
    if (!lot) {
        return (
            <Empty className="border">
                <EmptyHeader>
                    <EmptyMedia variant="icon"><Tags /></EmptyMedia>
                    <EmptyTitle>{lotNumber} numaralı lot bulunamadı</EmptyTitle>
                    <EmptyDescription>İş iptal edildiyse ya da yeniden planlanıp daha az lota indiyse bu numara artık yoktur.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button asChild variant="outline"><Link href="/uretim/lotlar">Lot listesine dön</Link></Button>
                </EmptyContent>
            </Empty>
        )
    }

    const first = lot.outputs[0]
    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ms-2">
                <Link href="/uretim/lotlar"><ArrowLeft className="h-4 w-4" />Lotlar</Link>
            </Button>
            <ProductionPageHeader
                icon={<Tags />}
                title={`Lot ${lot.lotNumber}`}
                description={`${first ? `${first.productName} · ${first.order?.variantCode ?? first.sizeCode}` : ""} — ${formatLotShiftDay(lot)} (${formatLotTimeRange(lot)}), ${lot.job.machine.code} · ${lot.job.mold.code}`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-2xl">
                            <Link href={`/uretim/tahta?bas=${lot.shiftDate}`}><ChartGantt className="h-4 w-4" />Tahtada gör</Link>
                        </Button>
                        <LotLabelDialog lot={lot} />
                    </div>
                )}
            />

            <dl className="grid gap-3 rounded-2xl border p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="İş" value={<span className="inline-flex items-center gap-2">{lot.job.lotBaseNumber} <JobStatusBadge status={lot.job.status} /></span>} />
                <Detail label="Lot durumu" value={<LotDisplayStatusBadge lot={lot} />} />
                <Detail label="Planlanan" value={`${lotPlannedQuantity(lot.outputs).toLocaleString("tr-TR")} adet · ${lot.plannedShots.toLocaleString("tr-TR")} baskı`} />
                <Detail label="Çevrim" value={`${lot.job.cycleTimeSec.toLocaleString("tr-TR")} sn`} />
                <Detail label="Makine" value={`${lot.job.machine.code} · ${lot.job.machine.name}`} />
                <Detail label="Kalıp" value={`${lot.job.mold.code} · ${lot.job.mold.name}`} />
                <Detail
                    label="Renk"
                    value={lot.colorName ? (
                        <span className="inline-flex items-center gap-1.5">
                            {lot.colorHex ? <span className="h-3 w-3 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: lot.colorHex }} /> : null}
                            {lot.colorName}
                        </span>
                    ) : "—"}
                />
                <Detail
                    label="Lot süresi"
                    value={formatDurationMinutes((new Date(lot.plannedEndAt).getTime() - new Date(lot.plannedStartAt).getTime()) / 60_000)}
                />
            </dl>

            <section className="space-y-2">
                <h2 className="text-sm font-semibold">Çıktılar</h2>
                <div className="overflow-hidden rounded-2xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ölçü</TableHead>
                                <TableHead>Emir</TableHead>
                                <TableHead className="text-end">Göz</TableHead>
                                <TableHead className="text-end">Planlanan</TableHead>
                                <TableHead className="text-end">Sağlam / fire</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lot.outputs.map((output) => (
                                <TableRow key={output.jobOutputId}>
                                    <TableCell><span className="font-mono">{output.sizeCode}</span> <span className="text-muted-foreground">{output.productName}</span></TableCell>
                                    <TableCell>
                                        {output.order ? (
                                            <Link href={`/uretim/emirler?q=${encodeURIComponent(output.order.orderNumber)}&durum=all`} className="underline-offset-4 hover:underline">
                                                {output.order.orderNumber} · <span className="font-mono text-xs">{output.order.variantCode}</span>
                                            </Link>
                                        ) : <span className="text-muted-foreground">Yan ürün (stok)</span>}
                                    </TableCell>
                                    <TableCell className="text-end tabular-nums">{output.cavities}</TableCell>
                                    <TableCell className="text-end tabular-nums">{output.plannedQuantity.toLocaleString("tr-TR")}</TableCell>
                                    <TableCell className="text-end tabular-nums">
                                        {lot.reportedAt ? `${output.goodQuantity.toLocaleString("tr-TR")} / ${output.scrapQuantity.toLocaleString("tr-TR")}` : "—"}
                                        {lot.reportedAt && output.scrapReasons.length > 0 ? (
                                            <div className="text-xs text-muted-foreground">
                                                {output.scrapReasons.map((entry) => `${entry.reason.name} ${entry.quantity.toLocaleString("tr-TR")}`).join(" · ")}
                                                {output.scrapQuantity > output.scrapReasons.reduce((sum, entry) => sum + entry.quantity, 0)
                                                    ? ` · belirtilmemiş ${(output.scrapQuantity - output.scrapReasons.reduce((sum, entry) => sum + entry.quantity, 0)).toLocaleString("tr-TR")}`
                                                    : ""}
                                            </div>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-sm font-semibold">İş {lot.job.lotBaseNumber} lotları</h2>
                <ul className="flex flex-wrap gap-2">
                    {lot.siblings.map((sibling) => (
                        <li key={sibling.lotNumber}>
                            <Link
                                href={lotDetailPath(sibling.lotNumber)}
                                aria-current={sibling.lotNumber === lot.lotNumber ? "page" : undefined}
                                className={cn(
                                    "flex flex-col rounded-xl border px-3 py-1.5 text-xs hover:bg-muted/60",
                                    sibling.lotNumber === lot.lotNumber && "border-primary bg-primary/5",
                                )}
                            >
                                <span className="font-semibold tabular-nums">{sibling.lotNumber}</span>
                                <span className="text-muted-foreground">{formatLotShiftDay(sibling)} · {formatLotTimeRange(sibling)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <LotReportSection lot={lot} onReport={() => setReporting(true)} />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <LotOperatorsSection lot={lot} />
                <LotNotesSection lot={lot} />
            </div>

            <LotReportDialog lotNumber={reporting ? lot.lotNumber : null} onOpenChange={(open) => setReporting(open)} />
        </div>
    )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    )
}
