import type { ProductionMachine } from "@/features/production/machines/api/types"

export type ProductionMachineFilters = {
    search: string
    areaId: string
    status: string
}

/**
 * Makine listesi küçük ve tamamı tek çağrıda geliyor → filtre İSTEMCİDE (AGENTS.md
 * "Filtrelemeyi nereye koymalı"); durum URL'de (nuqs).
 */
export function filterProductionMachines(
    machines: ProductionMachine[],
    { search, areaId, status }: ProductionMachineFilters,
): ProductionMachine[] {
    const needle = search.trim().toLocaleLowerCase("tr-TR")

    return machines.filter((machine) => {
        if (areaId && machine.areaId !== areaId) return false
        if (status && machine.status !== status) return false
        if (!needle) return true

        return [machine.code, machine.name, machine.brand, machine.model]
            .some((value) => value?.toLocaleLowerCase("tr-TR").includes(needle))
    })
}
