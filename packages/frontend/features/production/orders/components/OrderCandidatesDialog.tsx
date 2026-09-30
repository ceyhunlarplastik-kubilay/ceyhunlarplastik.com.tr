"use client"

import { Info, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { formatProductionOrderNumber } from "@core/helpers/production/productionOrders"
import { formatProductionDateTime } from "@core/helpers/production/productionTime"
import type { OrderCandidate, ProductionOrder } from "@/features/production/orders/api/types"
import { usePlanProductionOrder, useProductionOrderCandidates } from "@/features/production/orders/hooks/useProductionOrders"
import { OrderCandidateCard } from "./OrderCandidateCard"

/**
 * Emrin plan ÖNİZLEMESİ: ölçüyü basan kalıplar × uygun makineler, vardiya takvimine yayılmış
 * bitiş, termine yetişme ve makine maliyeti. Hesap sunucuda core motorla; hiçbir şey yazılmaz.
 */
/** Dialog'un emirden kullandığı alanlar — tahtadaki bekleyen emir kartı da açabilsin. */
export type OrderCandidatesDialogOrder = Pick<ProductionOrder, "id" | "orderNumber" | "status" | "variantCode" | "quantity" | "dueDate">

export function OrderCandidatesDialog({ order, onOpenChange }: { order: OrderCandidatesDialogOrder | null; onOpenChange: (open: boolean) => void }) {
    const query = useProductionOrderCandidates(order?.id ?? null)
    const planMutation = usePlanProductionOrder()
    const data = query.data
    // Bu dilimde emir tek işle planlanır: taslak / beklemedeki emir planlanabilir.
    const canPlan = order?.status === "DRAFT" || order?.status === "ON_HOLD"

    async function plan(candidate: OrderCandidate) {
        if (!order) return
        try {
            const { order: updated } = await planMutation.mutateAsync({
                id: order.id,
                input: { machineId: candidate.machine.id, moldId: candidate.mold.id },
            })
            const job = updated.jobs[updated.jobs.length - 1]
            toast.success(
                `${formatProductionOrderNumber(order.orderNumber)} planlandı · ${candidate.machine.code}`
                + (job ? ` · lotlar ${job.lots[0]?.lotNumber ?? job.lotBaseNumber}…` : ""),
            )
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor (ör. plan artık uymuyorsa 409).
        }
    }

    return (
        <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(56rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(62rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {order ? `${formatProductionOrderNumber(order.orderNumber)} · Planlama önizlemesi` : "Planlama önizlemesi"}
                    </DialogTitle>
                    <DialogDescription>
                        {order
                            ? `${order.variantCode} · ${order.quantity.toLocaleString("tr-TR")} adet${order.dueDate ? ` · termin ${formatDateKey(order.dueDate)}` : ""}. `
                            : ""}
                        Vardiya düzeni, takvim istisnaları ve duruşlarla şu andan itibaren hesaplanır; makinedeki ve kalıptaki
                        mevcut işler dolu sayılır. &quot;Planla&quot; işi ve vardiya lotlarını yazar (plan o anki verilerle yeniden hesaplanır).
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                    {query.isLoading ? (
                        <Skeleton className="h-48 rounded-2xl" />
                    ) : !data ? null : data.candidates.length === 0 ? (
                        <p className="rounded-2xl border p-4 text-sm text-muted-foreground">
                            Bu emri basabilecek uygun makine yok. Aşağıdaki gerekçelere ya da uyumluluk matrisine bakın.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {data.candidates.map((candidate) => (
                                <OrderCandidateCard
                                    key={`${candidate.machine.id}:${candidate.mold.id}`}
                                    candidate={candidate}
                                    horizonDays={data.horizonDays}
                                    canPlan={canPlan}
                                    planBusy={planMutation.isPending}
                                    isPlanning={
                                        planMutation.isPending
                                        && planMutation.variables?.input.machineId === candidate.machine.id
                                        && planMutation.variables?.input.moldId === candidate.mold.id
                                    }
                                    onPlan={(target) => void plan(target)}
                                />
                            ))}
                        </ul>
                    )}

                    {data && data.excluded.length > 0 ? (
                        <details className="rounded-2xl border p-4 text-sm">
                            <summary className="cursor-pointer font-medium">Uygun olmayan {data.excluded.length} makine × kalıp</summary>
                            <ul className="mt-2 space-y-1 text-muted-foreground">
                                {data.excluded.map((entry) => (
                                    <li key={`${entry.machineCode}:${entry.moldCode}`}>
                                        <span className="font-medium text-foreground">{entry.machineCode} · {entry.moldCode}:</span> {entry.reasons.join(" ")}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ) : null}

                    {data ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Info className="h-3.5 w-3.5" aria-hidden />
                                Hesap: {formatProductionDateTime(data.generatedAt)} · maliyet = saat maliyeti × (bağlama + üretim)
                            </span>
                            <Button type="button" variant="outline" size="sm" className="rounded-2xl" onClick={() => void query.refetch()} disabled={query.isFetching}>
                                {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Yeniden hesapla
                            </Button>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}
