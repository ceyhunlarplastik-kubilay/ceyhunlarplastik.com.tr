/**
 * Varyant tablosu satırlarını ara + sırala + sayfala.
 *
 * `dedupeVariantTable.ts`'in yerini alır. Eski sürüm, aynı fiziksel ürünün her
 * tedarikçi için AYRI bir `ProductVariant` satırı olması yüzünden çalışma zamanında
 * parmak izi (versionCode + ölçü seti + renk + hammadde) çıkarıp tekilleştirmek
 * zorundaydı. Yeni veri modelinde varyant = ürün + ölçü + versiyon olduğu ve
 * tedarikçi `ProductVariantSupplier` üzerinde yaşadığı için satırlar KURGU GEREĞİ
 * tekildir — tekilleştirme adımı tamamen kalktı.
 *
 * Sıralama da SQL'e indi (`size.code`, `version.code`); burada yalnız yön çevirme
 * yapılır. Ham Prisma satırları (include shape'ine göre) `any` tutulur; dönüş de
 * ham satır referanslarıdır — çağıran kendi DTO mapper'ıyla eşler.
 */

type VariantLike = {
    fullCode: string
    size?: {
        values?: Array<{
            requirement?: {
                measurementType?: { code: string } | null
            } | null
        }> | null
    } | null
}

export function paginateVariantTable<T extends VariantLike>(
    variants: T[],
    params: {
        page: number
        limit: number
        search?: string
        order: "asc" | "desc"
    },
): {
    paginated: T[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
        columns: string[]
    }
} {
    const { page, limit, search, order } = params

    let rows = variants

    if (search) {
        const needle = search.toLowerCase()
        rows = rows.filter((variant) => variant.fullCode.toLowerCase().includes(needle))
    }

    // Repository zaten ölçü kodu → versiyon sırasıyla getiriyor.
    if (order === "desc") {
        rows = [...rows].reverse()
    }

    const total = rows.length
    const totalPages = Math.ceil(total / limit)
    const paginated = rows.slice((page - 1) * limit, page * limit)

    // Dinamik kolonlar: sayfadaki tüm benzersiz ölçü kodları.
    const columns = Array.from(
        new Set(
            paginated.flatMap((variant) =>
                (variant.size?.values ?? [])
                    .map((value) => value.requirement?.measurementType?.code)
                    .filter((code): code is string => Boolean(code)),
            ),
        ),
    )

    return {
        paginated,
        meta: { page, limit, total, totalPages, columns },
    }
}
