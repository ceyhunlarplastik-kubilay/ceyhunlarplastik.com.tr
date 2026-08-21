import type {
    MatrixRow,
    MatrixSize,
    MatrixVersion,
} from "@/features/admin/productVariantMatrix/api/types"

export type VariantRowFilters = {
    q: string
    supplierId: string
    colorId: string
}

/**
 * Kayıtlı varyant satırlarını filtreler. Saf fonksiyon — sıralama repository'den
 * geldiği gibi (ölçü kodu, sonra versiyon) korunur.
 *
 * Arama; varyant kodunu, tedarikçili tam kodu, tedarikçinin kendi kodunu ve ölçü
 * DEĞERLERİNİ kapsar: operatör katalogdan "30" diye arayıp o ölçüyü bulabilmeli.
 */
export function filterVariantRows(input: {
    rows: MatrixRow[]
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    filters: VariantRowFilters
}): MatrixRow[] {
    const { rows, sizes, versions, filters } = input

    const sizeById = new Map(sizes.map((size) => [size.id, size]))
    const versionById = new Map(versions.map((version) => [version.id, version]))
    const needle = filters.q.trim().toLowerCase()

    return rows.filter((row) => {
        if (filters.supplierId && !row.suppliers.some((s) => s.supplierId === filters.supplierId)) {
            return false
        }

        if (filters.colorId) {
            const version = versionById.get(row.versionId)
            if (version?.colorId !== filters.colorId) return false
        }

        if (!needle) return true

        if (row.fullCode.toLowerCase().includes(needle)) return true
        if (row.name.toLowerCase().includes(needle)) return true

        const supplierMatch = row.suppliers.some(
            (supplier) =>
                supplier.fullCode?.toLowerCase().includes(needle) ||
                supplier.supplierCode?.toLowerCase().includes(needle) ||
                supplier.supplierVariantCode?.toLowerCase().includes(needle),
        )
        if (supplierMatch) return true

        const size = sizeById.get(row.sizeId)
        return (size?.values ?? []).some((value) => String(value.value).includes(needle))
    })
}

/** Bellek içi sayfalama — filtrelenmiş satır sayısı ve toplam sayfa ile birlikte. */
export function paginateVariantRows(rows: MatrixRow[], page: number, limit: number) {
    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(Math.max(1, page), totalPages)

    return {
        pageRows: rows.slice((safePage - 1) * limit, safePage * limit),
        total,
        totalPages,
        page: safePage,
    }
}
