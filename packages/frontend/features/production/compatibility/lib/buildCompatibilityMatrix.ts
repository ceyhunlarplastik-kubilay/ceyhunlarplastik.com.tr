import {
    evaluateMoldMachineCompatibility,
    recommendMachineForMold,
    type CompatibilityLevel,
    type CompatibilityResult,
} from "@core/helpers/production/moldMachineCompatibility"
import { computeShotWeightG } from "@core/helpers/production/molds"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import type { Mold } from "@/features/production/molds/api/types"
import { filterMolds } from "@/features/production/molds/lib/filterMolds"

export type CompatibilityMatrixFilters = {
    search: string
    /** Sütunlar (makineler) bu alana daraltılır; öneri de o alandaki makineler arasından. */
    areaId: string
    /** Kullanım dışı makineleri ve kalıpları da göster. */
    showInactive: boolean
}

export type CompatibilityCell = {
    machine: ProductionMachine
    result: CompatibilityResult
    isRecommended: boolean
}

export type CompatibilityRow = {
    mold: Mold
    shotWeightG: number | null
    cells: CompatibilityCell[]
    /** Uygun (✓) ya da dikkatle uygun (⚠) makine sayısı. */
    usableCount: number
}

export type CompatibilityMatrix = {
    machines: ProductionMachine[]
    rows: CompatibilityRow[]
    totals: Record<CompatibilityLevel, number>
}

/**
 * Kalıp × makine matrisi. Listeler tek çağrıda geliyor → hesap İSTEMCİDE ve core'daki
 * AYNI motorla (Faz 2 planlama da onu kullanacak); ayrı bir API ucu yok.
 */
export function buildCompatibilityMatrix(
    molds: Mold[],
    machines: ProductionMachine[],
    filters: CompatibilityMatrixFilters,
): CompatibilityMatrix {
    const visibleMachines = machines.filter((machine) => (
        (filters.showInactive || machine.status !== "INACTIVE")
        && (!filters.areaId || machine.areaId === filters.areaId)
    ))
    const visibleMolds = filterMolds(molds, { search: filters.search, status: "" })
        .filter((mold) => filters.showInactive || mold.status !== "RETIRED")

    const totals: Record<CompatibilityLevel, number> = { ok: 0, warning: 0, unknown: 0, error: 0 }

    const rows = visibleMolds.map((mold) => {
        const evaluated = visibleMachines.map((machine) => ({
            machine,
            result: evaluateMoldMachineCompatibility(mold, machine),
        }))
        const recommendedMachineId = recommendMachineForMold(evaluated)

        for (const { result } of evaluated) totals[result.verdict] += 1

        return {
            mold,
            shotWeightG: computeShotWeightG(mold.outputs, mold.runnerWeightG),
            cells: evaluated.map((cell) => ({ ...cell, isRecommended: cell.machine.id === recommendedMachineId })),
            usableCount: evaluated.filter(({ result }) => result.verdict === "ok" || result.verdict === "warning").length,
        }
    })

    return { machines: visibleMachines, rows, totals }
}
