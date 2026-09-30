"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { Search, SquareKanban } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { JOB_STATUS_LABELS, type ProductionJobStatus } from "@core/helpers/production/jobStateMachine"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { normalizeAdminRefreshInterval } from "@/features/admin/shared/config"
import type { KanbanJob, TransitionJobInput } from "@/features/production/kanban/api/types"
import { useProductionKanban, useTransitionProductionJob } from "@/features/production/kanban/hooks/useProductionKanban"
import { toCompletionInput } from "@/features/production/kanban/schema/jobCompletionForm"
import { groupKanbanColumns } from "@/features/production/kanban/utils/kanbanColumns"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { JobCompletionDialog } from "./JobCompletionDialog"
import { KanbanBoard } from "./KanbanBoard"

const ALL = "__all__"

/**
 * Durum panosu: işler Planlandı → Sahaya verildi → Kalıp bağlanıyor → Üretimde ⇄ Duraklatıldı →
 * Tamamlandı sütunlarında. Süzgeç (alan, makine, arama) ve otomatik yenileme URL'de.
 */
export function ProductionKanbanPageClient() {
    const [{ alan, makine, q, yenile }, setState] = useQueryStates({
        alan: parseAsString.withDefault(""),
        makine: parseAsString.withDefault(""),
        q: parseAsString.withDefault(""),
        yenile: parseAsInteger.withDefault(0),
    })
    const now = useNow(30_000)
    const today = productionDateKey(now)
    const refreshSeconds = normalizeAdminRefreshInterval(yenile)
    const kanbanQuery = useProductionKanban(refreshSeconds > 0 ? refreshSeconds * 1000 : false)
    const transitionMutation = useTransitionProductionJob()
    const [completing, setCompleting] = useState<KanbanJob | null>(null)

    const kanban = kanbanQuery.data
    const jobs = useMemo(() => kanban?.jobs ?? [], [kanban])
    const isInitialLoading = kanbanQuery.isLoading && !kanban
    const isBackgroundRefetch = kanbanQuery.isFetching && !isInitialLoading
    const pendingJobId = transitionMutation.isPending ? transitionMutation.variables?.id ?? null : null

    const areas = useMemo(() => uniqueBy(jobs.map((job) => job.machine.area)), [jobs])
    const machines = useMemo(
        () => uniqueBy(jobs.filter((job) => !alan || job.machine.area.id === alan).map((job) => job.machine)),
        [jobs, alan],
    )
    const columns = useMemo(
        () => groupKanbanColumns(jobs, { areaId: alan || null, machineId: makine || null, search: q }),
        [jobs, alan, makine, q],
    )

    async function transition(job: KanbanJob, input: TransitionJobInput): Promise<boolean> {
        try {
            const result = await transitionMutation.mutateAsync({ id: job.id, input })
            const orderNote = result.orders.length > 0 ? " · emir durumu güncellendi" : ""
            toast.success(`İş ${job.lotBaseNumber} → ${JOB_STATUS_LABELS[result.job.status]}${orderNote}`)
            return true
        } catch {
            // Hata mesajı (izinsiz geçiş, sürüm çakışması) global axios interceptor'ında.
            return false
        }
    }

    function requestTransition(job: KanbanJob, status: ProductionJobStatus) {
        if (status === "COMPLETED") {
            setCompleting(job)
            return
        }
        void transition(job, { status: status as TransitionJobInput["status"], expectedVersion: job.version })
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<SquareKanban />}
                title="Durum Panosu"
                description="İşleri sahadaki duruma göre izleyin: kartı sonraki sütuna sürükleyin ya da karttaki menüden durumu değiştirin. Sahaya verilen iş tahtada kilitlenir; tamamlarken sağlam ve fire adedi girilir."
                action={(
                    <Button asChild variant="outline" className="rounded-2xl">
                        <Link href="/uretim/tahta">Planlama tahtası</Link>
                    </Button>
                )}
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
                <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(event) => void setState({ q: event.target.value || null })}
                        placeholder="İş no, emir no, varyant kodu, ürün, makine ya da kalıp ara"
                        aria-label="Panoda ara"
                        className="ps-9"
                    />
                </div>
                <Select value={alan || ALL} onValueChange={(value) => void setState({ alan: value === ALL ? null : value, makine: null })}>
                    <SelectTrigger className="w-full" aria-label="Alana göre süz">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tüm alanlar</SelectItem>
                        {areas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>{area.code} · {area.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={makine || ALL} onValueChange={(value) => void setState({ makine: value === ALL ? null : value })}>
                    <SelectTrigger className="w-full" aria-label="Makineye göre süz">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tüm makineler</SelectItem>
                        {machines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id}>{machine.code} · {machine.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-96 rounded-2xl" />
            ) : (
                <div className="space-y-3">
                    <AdminListRefreshBar
                        dataUpdatedAt={kanbanQuery.dataUpdatedAt}
                        isFetching={kanbanQuery.isFetching}
                        onRefresh={() => void kanbanQuery.refetch()}
                        refreshIntervalSeconds={refreshSeconds}
                        onRefreshIntervalChange={(seconds) => void setState({ yenile: seconds || null })}
                    />
                    {jobs.length === 0 ? (
                        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                            Panoda iş yok. İşler emir planlanınca (Üretim Emirleri ya da Planlama Tahtası) &quot;Planlandı&quot; sütununa düşer.
                        </p>
                    ) : null}
                    <div className="relative" aria-busy={isBackgroundRefetch || transitionMutation.isPending}>
                        <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                        <KanbanBoard
                            columns={columns}
                            completedWindowDays={kanban?.completedWindowDays ?? 7}
                            now={now}
                            today={today}
                            pendingJobId={pendingJobId}
                            onTransition={requestTransition}
                        />
                    </div>
                </div>
            )}

            <JobCompletionDialog
                job={completing}
                isPending={transitionMutation.isPending}
                onOpenChange={(open) => { if (!open) setCompleting(null) }}
                onSubmit={(job, values) => {
                    void transition(job, toCompletionInput(values, job)).then((done) => { if (done) setCompleting(null) })
                }}
            />
        </div>
    )
}

function uniqueBy<T extends { id: string; code: string }>(items: T[]): T[] {
    const map = new Map<string, T>()
    for (const item of items) map.set(item.id, item)
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code, "tr"))
}
