/**
 * Varyant tablosu yanıtının `meta` bloğu.
 *
 * `paginateVariantTable.ts`'in yerini alır — o da `dedupeVariantTable.ts`'in
 * yerini almıştı. Zincirin son halkası: artık burada hiçbir veri işlenmiyor.
 *
 * Neden: eskiden bir ürünün TÜM varyantları belleğe çekilip arama/sıralama/
 * sayfalama orada yapılıyordu. Tekilleştirme adımı yeni veri modeliyle zaten
 * kalkmıştı (varyant = ürün + ölçü + versiyon, kurgu gereği tekil) ve sıralama
 * SQL'e inmişti; geriye kalan bellek-içi iş de SQL'e indirildi (P1.8(d)).
 *
 * `columns` da artık sayfadan türetilmiyor, ürün modelinin ölçü şablonundan
 * geliyor — eski davranışta ikinci sayfa birinciden farklı kolonlar
 * gösterebiliyordu, çünkü kolon listesi o sayfadaki satırlardan çıkarılıyordu.
 */
export function buildVariantTableMeta(input: {
    page: number
    limit: number
    total: number
    columns: string[]
}): {
    page: number
    limit: number
    total: number
    totalPages: number
    columns: string[]
} {
    const { page, limit, total, columns } = input

    return {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        columns,
    }
}
