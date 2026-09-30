import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import type { PlacementMode, PushJobFollowersResult, ShiftedJob } from "@/features/production/board/api/types"

export const PLACEMENT_MODE_OPTIONS: Array<{ value: PlacementMode; label: string; hint: string }> = [
    { value: "first-gap", label: "İlk boşluğa koy", hint: "İş bırakılan andan sonraki ilk boş ve çalışılan zamana yerleşir; diğer işler yerinde kalır." },
    { value: "push-later", label: "Sonrakileri kaydır", hint: "İş bırakılan ana yerleşir; aynı makinede o andan sonra başlayan planlı işler arkasına kaydırılır." },
]

/** URL değeri (`cakisma=kaydir`) ↔ kip. */
export function placementModeFromParam(value: string | null): PlacementMode {
    return value === "kaydir" ? "push-later" : "first-gap"
}

/**
 * Yerleşim sonucu bildirimi: "İş 1003 taşındı: M-02 · 29.09 08:15 · 2 iş kaydırıldı (1004, 1005)".
 * `shifted` = istenen an doluydu / vardiya dışıydı.
 */
export function describePlacementResult(input: { subject: string; verb: string; target: string; shifted: boolean; shiftedJobs: ShiftedJob[] }): string {
    const head = input.shifted
        ? `${input.subject} ilk uygun boşluğa yerleşti: ${input.target}`
        : `${input.subject} ${input.verb}: ${input.target}`
    if (input.shiftedJobs.length === 0) return head
    const numbers = input.shiftedJobs.map((job) => job.lotBaseNumber).join(", ")
    return `${head} · ${input.shiftedJobs.length} iş kaydırıldı (${numbers})`
}

/** Gecikme önerisi sonucu: "İş 1000 · tahmini bitiş 29.09 14:30 · 2 iş kaydırıldı (1001, 1002)". */
export function describePushFollowersResult(lotBaseNumber: number, result: PushJobFollowersResult): string {
    const head = `İş ${lotBaseNumber} · tahmini bitiş ${formatProductionShortDateTime(result.projectedEndAt)}`
    if (result.shiftedJobs.length === 0) return `${head} · sonraki işler zaten bu anın arkasında; kaydırma gerekmedi`
    const numbers = result.shiftedJobs.map((job) => job.lotBaseNumber).join(", ")
    return `${head} · ${result.shiftedJobs.length} iş kaydırıldı (${numbers})`
}
