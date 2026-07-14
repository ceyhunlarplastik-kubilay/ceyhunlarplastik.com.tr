/**
 * Varyant tablosu satırlarını tekilleştir + ara + sırala + sayfala.
 *
 * P1.8(B0): Public ve customer varyant-tablo handler'ları AYNI yapısal mantığı
 * paylaşır, yalnız DTO mapper'ları ve repository include'ları farklıdır. Dedup
 * kuralı: aynı versionCode + ölçü seti + renk + hammadde = tek tablo satırı.
 *
 * Ham Prisma satırları (include shape'ine göre) `any` tutulur; dönüş de ham
 * satır referanslarıdır — çağıran kendi DTO mapper'ıyla eşler.
 */

type VariantLike = {
    versionCode: string
    fullCode: string
    color?: { id: string } | null
    materials: Array<{ id: string }>
    measurements: Array<{
        value: number
        measurementType: { code: string; displayOrder: number }
    }>
}

export function dedupeAndPaginateVariantTable<T extends VariantLike>(
    rawVariants: T[],
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

    // 1. Tekilleştir: aynı fingerprint = tek satır (ilk kazanır — repo orderBy
    //    determinizmi bunu besliyor).
    const uniqueRows = new Map<string, T>()

    for (const v of rawVariants) {
        const measurementsKey = v.measurements
            .map((m) => `${m.measurementType.code}:${m.value}`)
            .sort()
            .join("|")
        const colorKey = v.color?.id ?? "no-color"
        const materialKeys = v.materials.map((mat) => mat.id).sort().join("|")
        const fingerprint = `${v.versionCode}#${measurementsKey}#${colorKey}#${materialKeys}`

        if (!uniqueRows.has(fingerprint)) {
            uniqueRows.set(fingerprint, v)
        }
    }

    let deduped = Array.from(uniqueRows.values())

    // 2. Arama
    if (search) {
        const s = search.toLowerCase()
        deduped = deduped.filter((v) =>
            v.versionCode.toLowerCase().includes(s) ||
            v.fullCode.toLowerCase().includes(s),
        )
    }

    // 3. Ölçü displayOrder'ına göre boyut-boyut sırala
    deduped.sort((a, b) => {
        const aM = [...a.measurements].sort((m1, m2) => m1.measurementType.displayOrder - m2.measurementType.displayOrder)
        const bM = [...b.measurements].sort((m1, m2) => m1.measurementType.displayOrder - m2.measurementType.displayOrder)

        const len = Math.max(aM.length, bM.length)
        for (let i = 0; i < len; i++) {
            const valA = aM[i]?.value ?? 0
            const valB = bM[i]?.value ?? 0
            if (valA !== valB) return valA - valB
        }
        return a.versionCode.localeCompare(b.versionCode)
    })

    if (order === "desc") {
        deduped.reverse()
    }

    // 4. Bellek içi sayfalama
    const total = deduped.length
    const totalPages = Math.ceil(total / limit)
    const paginated = deduped.slice((page - 1) * limit, page * limit)

    // 5. Dinamik kolonlar (sayfadaki tüm benzersiz ölçü kodları)
    const columns = Array.from(
        new Set(paginated.flatMap((v) => v.measurements.map((m) => m.measurementType.code))),
    )

    return {
        paginated,
        meta: { page, limit, total, totalPages, columns },
    }
}
