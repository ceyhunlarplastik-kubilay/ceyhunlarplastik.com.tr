"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { ChartGantt, Factory } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { isValidDateKey } from "@core/helpers/production/productionCalendar"
import { formatProductionShortDateTime, productionDateKey } from "@core/helpers/production/productionTime"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { normalizeAdminRefreshInterval } from "@/features/admin/shared/config"
import type { BoardJob, BoardPendingOrder, RescheduleJobInput } from "@/features/production/board/api/types"
import { useProductionBoard, usePushJobFollowers, useRescheduleProductionJob } from "@/features/production/board/hooks/useProductionBoard"
import { toRescheduleInput } from "@/features/production/board/schema/boardMoveForm"
import {
    describePlacementResult,
    describePushFollowersResult,
    PLACEMENT_MODE_OPTIONS,
    placementModeFromParam,
} from "@/features/production/board/utils/placementMessage"
import { OrderCandidatesDialog } from "@/features/production/orders/components/OrderCandidatesDialog"
import { usePlanProductionOrder } from "@/features/production/orders/hooks/useProductionOrders"
import { formatProductionOrderNumber } from "@core/helpers/production/productionOrders"
import {
    boardWindow,
    DEFAULT_BOARD_WINDOW_DAYS,
    groupMachinesByArea,
    normalizeWindowDays,
} from "@/features/production/board/utils/boardGeometry"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { BoardAlertsPanel } from "./BoardAlertsPanel"
import { BoardJobDialog } from "./BoardJobDialog"
import { ProductionBoardTimeline } from "./ProductionBoardTimeline"
import { ProductionBoardToolbar } from "./ProductionBoardToolbar"

/**
 * Planlama tahtası: makine satırları × tarih penceresi. Pencere başı, gün sayısı, alan
 * süzgeci ve otomatik yenileme URL'de (paylaşılabilir, geri tuşu korur). Planlı iş sürükle-
 * bırakla ya da ayrıntıdaki "Taşı" formuyla taşınır; plan sunucuda yeniden hesaplanır.
 */
export function ProductionBoardPageClient() {
    const [{ bas, gun, alan, yenile, cakisma, is: selectedLotBase }, setState] = useQueryStates({
        bas: parseAsString,
        gun: parseAsInteger.withDefault(DEFAULT_BOARD_WINDOW_DAYS),
        alan: parseAsString.withDefault(""),
        yenile: parseAsInteger.withDefault(0),
        // Seçili iş (iş kökü, ör. 1000): ayrıntı dialog'u açık gelir — üretim bildirimleri buraya bağlanır.
        is: parseAsInteger,
        cakisma: parseAsString,
    })
    const placementMode = placementModeFromParam(cakisma)
    const now = useNow(30_000)
    const today = productionDateKey(now)
    const days = normalizeWindowDays(gun)
    const from = bas && isValidDateKey(bas) ? bas : today
    const range = boardWindow(from, days)
    const refreshSeconds = normalizeAdminRefreshInterval(yenile)

    const boardQuery = useProductionBoard(range, refreshSeconds > 0 ? refreshSeconds * 1000 : false)
    const rescheduleMutation = useRescheduleProductionJob()
    const planMutation = usePlanProductionOrder()
    const pushMutation = usePushJobFollowers()
    const pendingJobId = rescheduleMutation.isPending ? rescheduleMutation.variables?.id ?? null : null
    const isPlacing = rescheduleMutation.isPending || planMutation.isPending || pushMutation.isPending
    const [suggesting, setSuggesting] = useState<BoardPendingOrder | null>(null)

    const board = boardQuery.data
    const isInitialLoading = boardQuery.isLoading && !board
    const isBackgroundRefetch = boardQuery.isFetching && !isInitialLoading

    const areas = useMemo(() => groupMachinesByArea(board?.machines ?? []).map((group) => group.area), [board])
    const groups = useMemo(() => groupMachinesByArea(board?.machines ?? [], alan || null), [board, alan])
    const selectedJob: BoardJob | null = board?.jobs.find((job) => job.lotBaseNumber === selectedLotBase) ?? null
    const selectJob = (job: BoardJob | null) => void setState({ is: job ? job.lotBaseNumber : null })
    const selectedMachine = selectedJob ? board?.machines.find((machine) => machine.id === selectedJob.machineId) ?? null : null

    function machineCode(machineId: string) {
        return board?.machines.find((machine) => machine.id === machineId)?.code ?? ""
    }

    async function moveJob(job: BoardJob, input: RescheduleJobInput): Promise<boolean> {
        try {
            const result = await rescheduleMutation.mutateAsync({ id: job.id, input: { ...input, placement: placementMode } })
            toast.success(describePlacementResult({
                subject: `İş ${job.lotBaseNumber}`,
                verb: "taşındı",
                target: `${machineCode(result.job.machineId)} · ${formatProductionShortDateTime(result.job.setupStartAt)}`,
                shifted: result.shifted,
                shiftedJobs: result.shiftedJobs,
            }))
            return true
        } catch {
            // Hata mesajı (uygunsuz makine, sürüm çakışması) global axios interceptor'ında.
            return false
        }
    }

    async function pushFollowers(job: BoardJob) {
        try {
            const result = await pushMutation.mutateAsync(job.id)
            toast.success(describePushFollowersResult(job.lotBaseNumber, result))
        } catch {
            // Hata mesajı (plana göre gidiyor, arkasında iş yok, sürüm çakışması) global axios interceptor'ında.
        }
    }

    async function planOrder(order: BoardPendingOrder, machineId: string, startAt: Date) {
        try {
            const result = await planMutation.mutateAsync({
                id: order.id,
                input: { machineId, startAt: startAt.toISOString(), placement: placementMode },
            })
            const job = result.order.jobs[result.order.jobs.length - 1]
            toast.success(describePlacementResult({
                subject: formatProductionOrderNumber(order.orderNumber),
                verb: job ? `planlandı (iş ${job.lotBaseNumber})` : "planlandı",
                target: `${machineCode(machineId)} · ${formatProductionShortDateTime(job?.setupStartAt ?? startAt)}`,
                shifted: result.shifted,
                shiftedJobs: result.shiftedJobs,
            }))
        } catch {
            // Hata mesajı (uygun kalıp yok, ufukta bitmiyor) global axios interceptor'ında.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<ChartGantt />}
                title="Planlama Tahtası"
                description="Makine satırlarında planlı işler ve vardiya lotları. Gri alanlar vardiya dışı, taralı alanlar duruş; kesikli kısım kalıp bağlama. Bekleyen emri bir satıra sürükleyerek planlayın, planlı işi sürükleyerek taşıyın; tıklayınca ayrıntısı açılır."
                action={(
                    <Button asChild variant="outline" className="rounded-2xl">
                        <Link href="/uretim/emirler">Emirlerden planla</Link>
                    </Button>
                )}
            />

            <ProductionBoardToolbar
                from={from}
                to={range.to}
                today={today}
                days={days}
                areaId={alan}
                areas={areas}
                onFromChange={(next) => void setState({ bas: next === today ? null : next })}
                onDaysChange={(next) => void setState({ gun: next === DEFAULT_BOARD_WINDOW_DAYS ? null : next })}
                onAreaChange={(next) => void setState({ alan: next || null })}
                placementMode={placementMode}
                onPlacementModeChange={(mode) => void setState({ cakisma: mode === "push-later" ? "kaydir" : null })}
            />

            {isInitialLoading ? (
                <Skeleton className="h-96 rounded-2xl" />
            ) : !board || board.machines.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Factory />
                        </EmptyMedia>
                        <EmptyTitle>Tahtada gösterilecek makine yok</EmptyTitle>
                        <EmptyDescription>
                            Pasif olmayan makineler burada satır olarak görünür. Önce makine tanımlayın ve bir vardiya düzenine bağlayın.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild variant="outline">
                            <Link href="/uretim/makineler">Makinelere git</Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="space-y-3">
                    <AdminListRefreshBar
                        dataUpdatedAt={boardQuery.dataUpdatedAt}
                        isFetching={boardQuery.isFetching}
                        onRefresh={() => void boardQuery.refetch()}
                        refreshIntervalSeconds={refreshSeconds}
                        onRefreshIntervalChange={(seconds) => void setState({ yenile: seconds || null })}
                    />
                    <BoardAlertsPanel jobs={board.jobs} machineCode={machineCode} onSelectJob={selectJob} />
                    {board.jobs.length === 0 ? (
                        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                            Bu pencerede planlı iş yok. İşler, Üretim Emirleri sayfasında &quot;Öner&quot; ile seçilen
                            makine × kalıp planından oluşur.
                        </p>
                    ) : null}
                    <div className="relative" aria-busy={isBackgroundRefetch || isPlacing}>
                        <AdminSectionLoadingOverlay
                            isVisible={isBackgroundRefetch || isPlacing}
                            label={isPlacing ? "Plan hesaplanıyor…" : undefined}
                        />
                        <ProductionBoardTimeline
                            board={board}
                            groups={groups}
                            days={days}
                            now={now}
                            onSelectJob={selectJob}
                            onMoveJob={(job, machineId, startAt) => void moveJob(job, {
                                machineId,
                                startAt: startAt.toISOString(),
                                expectedVersion: job.version,
                            })}
                            pendingJobId={pendingJobId}
                            onPlanOrder={(order, machineId, startAt) => void planOrder(order, machineId, startAt)}
                            onSuggestOrder={setSuggesting}
                            placementHint={PLACEMENT_MODE_OPTIONS.find((option) => option.value === placementMode)?.hint}
                        />
                    </div>
                </div>
            )}

            <BoardJobDialog
                job={selectedJob}
                machine={selectedMachine}
                machines={board?.machines ?? []}
                boardJobs={board?.jobs ?? []}
                isMoving={rescheduleMutation.isPending}
                isPushing={pushMutation.isPending}
                onPushFollowers={(job) => void pushFollowers(job)}
                placementMode={placementMode}
                onMove={(job, values) => {
                    void moveJob(job, toRescheduleInput(values, job)).then((moved) => { if (moved) selectJob(null) })
                }}
                onOpenChange={(open) => { if (!open) selectJob(null) }}
            />
            <OrderCandidatesDialog order={suggesting} onOpenChange={(open) => { if (!open) setSuggesting(null) }} />
        </div>
    )
}
