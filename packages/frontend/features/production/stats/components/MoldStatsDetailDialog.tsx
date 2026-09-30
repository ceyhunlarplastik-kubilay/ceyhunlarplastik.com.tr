"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CYCLE_SUGGESTION_MIN_LOTS } from "@core/helpers/production/moldStats"
import { describeMaintenance } from "@core/helpers/production/moldMaintenance"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { cn } from "@/lib/utils"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import { useSetMoldMachineCycle } from "@/features/production/molds/hooks/useMolds"
import type { MoldMachineCycleStats, MoldStatsRow } from "@/features/production/stats/api/types"
import { suggestionReason, versionLabel } from "@/features/production/stats/lib/moldStatsFormat"
import { cycleDeviation, formatCycle, formatQuantity, formatRate } from "@/features/production/stats/lib/productHistoryFormat"
import { MOLD_STATUS_BADGE_CLASSES, MOLD_STATUS_LABELS } from "@/features/production/shared/moldStatus"

function applyDescription(mold: MoldStatsRow, machine: MoldMachineCycleStats, cycleTimeSec: number): string {
    const target = formatCycle(cycleTimeSec)
    const head = !machine.hasCard
        ? `${machine.machineCode} için ${mold.code} kalıbının makine kartı oluşturulacak, çevrim ${target}.`
        : machine.cardCycleSec === null
            ? `${mold.code} · ${machine.machineCode} kartına ${target} çevrim yazılacak.`
            : `${mold.code} · ${machine.machineCode} kartındaki çevrim ${formatCycle(machine.cardCycleSec)} → ${target} olacak.`
    return `${head} Sonraki planlar bu değeri kullanır; mevcut planlar değişmez.`
}

/** Öneri yoksa neden: veri yok / az, ya da kart (plan) zaten gerçeğe yakın. */
function noSuggestionText(machine: MoldMachineCycleStats): string {
    if (machine.reportedLotCount === 0) return "Aralıkta üretim yok"
    if (machine.reportedLotCount < CYCLE_SUGGESTION_MIN_LOTS) return `Öneri için en az ${CYCLE_SUGGESTION_MIN_LOTS} vardiya`
    return machine.cardCycleSec !== null ? "Kartla uyumlu" : "Planla uyumlu"
}

/** "24,0 sn +%20,0" — %5'i aşan fark turuncu. */
function CycleWithDeviation({ actual, reference }: { actual: number | null; reference: number | null }) {
    const deviation = cycleDeviation(actual, reference)
    return (
        <>
            {formatCycle(actual)}
            {deviation ? (
                <span className={cn("ms-1 text-xs", Math.abs(deviation.ratio) >= 0.05 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                    {deviation.text}
                </span>
            ) : null}
        </>
    )
}

/** "Karta uygula" (onaylı) + gerekçe; öneri yoksa nedeni. */
function SuggestionAction({ mold, machine }: { mold: MoldStatsRow; machine: MoldMachineCycleStats }) {
    const mutation = useSetMoldMachineCycle()
    const suggestion = machine.suggestion
    if (!suggestion) return <span className="text-xs text-muted-foreground">{noSuggestionText(machine)}</span>

    async function apply(cycleTimeSec: number) {
        try {
            const result = await mutation.mutateAsync({ moldId: mold.moldId, machineId: machine.machineId, cycleTimeSec })
            toast.success(result.created ? `${machine.machineCode} makine kartı oluşturuldu (${formatCycle(cycleTimeSec)})` : `${machine.machineCode} kartı güncellendi (${formatCycle(cycleTimeSec)})`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-1">
            <ConfirmDeleteDialog
                trigger={(
                    <Button type="button" size="sm" className="h-7 rounded-full px-3 text-xs" disabled={mutation.isPending}>
                        Karta uygula: {formatCycle(suggestion.cycleTimeSec)}
                    </Button>
                )}
                title="Makine kartı güncellensin mi?"
                description={applyDescription(mold, machine, suggestion.cycleTimeSec)}
                confirmLabel="Karta uygula"
                onConfirm={() => void apply(suggestion.cycleTimeSec)}
            />
            <p className="text-xs text-muted-foreground">{suggestionReason(machine)}</p>
        </div>
    )
}

function cardCycleText(machine: MoldMachineCycleStats) {
    return machine.hasCard ? formatCycle(machine.cardCycleSec) : "kart yok"
}

/** Makine başına: kart ↔ gerçek ↔ plan çevrimi ve öneri. Geniş ekranda tablo, telefonda kart. */
function MachineCycles({ mold }: { mold: MoldStatsRow }) {
    if (mold.machines.length === 0) {
        return <p className="text-sm text-muted-foreground">Makine kartı yok ve aralıkta üretim yapılmamış.</p>
    }
    return (
        <>
            <div className="hidden overflow-x-auto rounded-xl border sm:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Makine</TableHead>
                            <TableHead className="text-end">Kart</TableHead>
                            <TableHead className="text-end">Gerçek</TableHead>
                            <TableHead className="text-end">Plan</TableHead>
                            <TableHead className="text-end">Vardiya · baskı</TableHead>
                            <TableHead>Öneri</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mold.machines.map((machine) => (
                            <TableRow key={machine.machineId}>
                                <TableCell className="whitespace-nowrap font-medium">{machine.machineCode}</TableCell>
                                <TableCell className={cn("whitespace-nowrap text-end tabular-nums", !machine.hasCard && "text-xs text-muted-foreground")}>
                                    {cardCycleText(machine)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-end tabular-nums">
                                    <CycleWithDeviation actual={machine.actualCycleSec} reference={machine.cardCycleSec ?? machine.plannedCycleSec} />
                                </TableCell>
                                <TableCell className="text-end tabular-nums">{formatCycle(machine.plannedCycleSec)}</TableCell>
                                <TableCell className="whitespace-nowrap text-end tabular-nums text-xs">
                                    {machine.reportedLotCount} · {formatQuantity(machine.shots)}
                                </TableCell>
                                <TableCell className="min-w-44"><SuggestionAction mold={mold} machine={machine} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <ul className="space-y-2 sm:hidden">
                {mold.machines.map((machine) => (
                    <li key={machine.machineId} className="space-y-2 rounded-xl border p-3">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="font-medium">{machine.machineCode}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">
                                {machine.reportedLotCount} vardiya · {formatQuantity(machine.shots)} baskı
                            </span>
                        </div>
                        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm tabular-nums">
                            <div className="whitespace-nowrap">
                                <dt className="text-xs text-muted-foreground">Kart</dt>
                                <dd>{cardCycleText(machine)}</dd>
                            </div>
                            <div className="whitespace-nowrap">
                                <dt className="text-xs text-muted-foreground">Gerçek</dt>
                                <dd><CycleWithDeviation actual={machine.actualCycleSec} reference={machine.cardCycleSec ?? machine.plannedCycleSec} /></dd>
                            </div>
                            <div className="whitespace-nowrap">
                                <dt className="text-xs text-muted-foreground">Plan</dt>
                                <dd>{formatCycle(machine.plannedCycleSec)}</dd>
                            </div>
                        </dl>
                        <SuggestionAction mold={mold} machine={machine} />
                    </li>
                ))}
            </ul>
        </>
    )
}

/**
 * Kalıp ayrıntısı: bakım, makine başına kart ↔ gerçek ↔ plan çevrimi ve öneri ("Karta uygula"),
 * renk / hammadde başına gerçek çevrim. Sabit başlık + kendi kayan gövdesi (uzun dialog deseni).
 */
export function MoldStatsDetailDialog({ row: openRow, onOpenChange }: { row: MoldStatsRow | null; onOpenChange: (open: boolean) => void }) {
    // Kapanış animasyonu sürerken içerik boşalmasın: son açılan kalıp tutulur (prop'a göre durum ayarı).
    const [lastRow, setLastRow] = useState(openRow)
    if (openRow && openRow !== lastRow) setLastRow(openRow)
    const row = openRow ?? lastRow

    return (
        <Dialog open={Boolean(openRow)} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(56rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(56rem,calc(100vw-3rem))]">
                {row ? (
                    <>
                        <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                            <DialogTitle className="flex flex-wrap items-center gap-2">
                                {row.code} · {row.name}
                                {row.status === "ACTIVE" ? null : (
                                    <Badge variant="outline" className={cn("rounded-full text-[10px]", MOLD_STATUS_BADGE_CLASSES[row.status])}>
                                        {MOLD_STATUS_LABELS[row.status]}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                Toplam {formatQuantity(row.totalShots)} baskı · {describeMaintenance(row.maintenance)}
                                {row.lastMaintenanceAt ? ` · son bakım ${formatDateKey(row.lastMaintenanceAt.slice(0, 10))}` : ""}
                                {row.shotsAhead > 0 ? ` · açık işlerde ${formatQuantity(row.shotsAhead)} baskı var` : ""}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                            <section className="space-y-2">
                                <h3 className="text-sm font-semibold">Makine kartları ve çevrim</h3>
                                <MachineCycles mold={row} />
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Gerçek çevrim: raporlu vardiyalarda (süre − duruş) ÷ baskı. Öneri, o makinede en az {CYCLE_SUGGESTION_MIN_LOTS} raporlu vardiya varsa ve
                                    gerçek çevrim karttakinden (kart yoksa planın varsaydığından) en az %5 farklıysa çıkar; otomatik yazılmaz. Karttaki çevrim, emirde elle
                                    çevrim girilmemişse plana esas olur.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-sm font-semibold">Renk ve hammadde</h3>
                                {row.versions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Aralıkta raporlu vardiya yok.</p>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Renk · hammadde</TableHead>
                                                    <TableHead className="text-end">Gerçek</TableHead>
                                                    <TableHead className="text-end">Plan</TableHead>
                                                    <TableHead className="text-end">Vardiya · baskı</TableHead>
                                                    <TableHead className="text-end">Fire</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {row.versions.map((version) => {
                                                    const total = version.goodQuantity + version.scrapQuantity
                                                    return (
                                                        <TableRow key={version.versionSignature}>
                                                            <TableCell className="whitespace-nowrap">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    {version.colorHex ? (
                                                                        <span className="h-2.5 w-2.5 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: version.colorHex }} aria-hidden />
                                                                    ) : null}
                                                                    {versionLabel(version)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap text-end tabular-nums">
                                                                <CycleWithDeviation actual={version.actualCycleSec} reference={version.plannedCycleSec} />
                                                            </TableCell>
                                                            <TableCell className="text-end tabular-nums">{formatCycle(version.plannedCycleSec)}</TableCell>
                                                            <TableCell className="whitespace-nowrap text-end tabular-nums text-xs">{version.reportedLotCount} · {formatQuantity(version.shots)}</TableCell>
                                                            <TableCell className="text-end tabular-nums">{formatRate(total > 0 ? version.scrapQuantity / total : null)}</TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </section>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
