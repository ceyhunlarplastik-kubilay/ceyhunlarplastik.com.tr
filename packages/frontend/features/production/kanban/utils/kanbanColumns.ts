import { KANBAN_JOB_STATUSES, type ProductionJobStatus } from "@core/helpers/production/jobStateMachine"
import type { KanbanJob } from "@/features/production/kanban/api/types"

export type KanbanFilters = { areaId: string | null; machineId: string | null; search: string }

function matches(job: KanbanJob, filters: KanbanFilters): boolean {
    if (filters.areaId && job.machine.area.id !== filters.areaId) return false
    if (filters.machineId && job.machine.id !== filters.machineId) return false
    const needle = filters.search.trim().toLocaleLowerCase("tr-TR")
    if (!needle) return true
    const haystack = [
        String(job.lotBaseNumber),
        job.machine.code,
        job.mold.code,
        ...job.outputs.flatMap((output) => [output.sizeCode, output.productName, output.order?.orderNumber ?? "", output.order?.variantCode ?? ""]),
    ].join(" ").toLocaleLowerCase("tr-TR")
    return haystack.includes(needle)
}

/**
 * Sütunlar: sıra durum makinesinden; sütun içinde planlı başlangıca göre, "Tamamlandı" en son
 * tamamlanan üstte. Süzgeç istemcide (pano yalnız aktif + son günlerin işlerini taşır).
 */
export function groupKanbanColumns(jobs: KanbanJob[], filters: KanbanFilters): Record<ProductionJobStatus, KanbanJob[]> {
    const columns = Object.fromEntries(KANBAN_JOB_STATUSES.map((status) => [status, [] as KanbanJob[]])) as Record<ProductionJobStatus, KanbanJob[]>
    columns.CANCELLED = []
    for (const job of jobs) {
        if (matches(job, filters)) columns[job.status]?.push(job)
    }
    for (const status of KANBAN_JOB_STATUSES) {
        columns[status].sort((a, b) => status === "COMPLETED"
            ? b.updatedAt.localeCompare(a.updatedAt)
            : a.setupStartAt.localeCompare(b.setupStartAt))
    }
    return columns
}

/** Planlı bitişi geçmiş ve hâlâ tamamlanmamış iş: gecikme (dakika); değilse `null`. */
export function jobDelayMinutes(job: Pick<KanbanJob, "status" | "plannedEndAt">, now: Date): number | null {
    if (job.status === "COMPLETED" || job.status === "CANCELLED") return null
    const late = now.getTime() - new Date(job.plannedEndAt).getTime()
    return late > 60_000 ? Math.round(late / 60_000) : null
}

/** Emirli çıktıların en yakın termini ("YYYY-MM-DD"); yoksa `null`. */
export function earliestDueDate(job: Pick<KanbanJob, "outputs">): string | null {
    const dates = job.outputs.map((output) => output.order?.dueDate).filter((date): date is string => Boolean(date)).sort()
    return dates[0] ?? null
}

/** Kartın başlık emri: ilk emirli çıktı. */
export function primaryOrder(job: Pick<KanbanJob, "outputs">) {
    return job.outputs.find((output) => output.order)?.order ?? null
}
