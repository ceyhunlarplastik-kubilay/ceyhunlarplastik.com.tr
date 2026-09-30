import type { Mold } from "@/features/production/molds/api/types"

export type MoldFilters = {
    search: string
    status: string
}

/**
 * Kalıp listesi tek çağrıda geliyor → filtre İSTEMCİDE, durum URL'de (nuqs).
 * Arama kalıbın kodu/adı/depo yeri ile bastığı ölçü kodunda ve ürün modelinde.
 */
export function filterMolds(molds: Mold[], { search, status }: MoldFilters): Mold[] {
    const needle = search.trim().toLocaleLowerCase("tr-TR")

    return molds.filter((mold) => {
        if (status && mold.status !== status) return false
        if (!needle) return true

        const haystack = [
            mold.code,
            mold.name,
            mold.storageLocation,
            ...mold.outputs.flatMap((output) => [output.size.sizeCode, output.product.code, output.product.name]),
        ]
        return haystack.some((value) => value?.toLocaleLowerCase("tr-TR").includes(needle))
    })
}
