/**
 * Sepet lojistiği için Prisma'dan okunan dar satır şekli.
 *
 * Decimal alanları bu katmana `unknown` olarak gelir. Böylece saf normalizasyon
 * yardımcısı Prisma tipine bağlanmadan number, string ve Decimal-benzeri değerleri
 * güvenli biçimde işleyebilir.
 */
export type CartLogisticsSupplierRow = {
    unitsPerPackage: unknown
    packageLengthMm: unknown
    packageWidthMm: unknown
    packageHeightMm: unknown
    packageWeightKg: unknown
}

export type CartLogisticsVariantRow = {
    id: string
    variantSuppliers: CartLogisticsSupplierRow[]
}

export const CART_LOGISTICS_PROFILE_STATUSES = [
    "READY",
    "NOT_FOUND",
    "NO_ACTIVE_SUPPLIER",
    "AMBIGUOUS_ACTIVE_SUPPLIER",
    "INCOMPLETE_PACKAGE_DATA",
] as const

export type CartLogisticsProfileStatus = typeof CART_LOGISTICS_PROFILE_STATUSES[number]

export type CartLogisticsProfile = {
    productVariantId: string
    status: CartLogisticsProfileStatus
    logistics: {
        unitsPerPackage: number
        packageVolumeM3: number
        packageWeightKg: number | null
    } | null
}

/** İstemci ve handler'ın aynı kararlı kimlik kümesini kullanmasını sağlar. */
export function normalizeCartLogisticsVariantIds(variantIds: readonly string[]): string[] {
    return [...new Set(variantIds)].sort()
}

function toFiniteNumber(value: unknown): number | null {
    if (value === null || value === undefined || typeof value === "boolean") return null

    try {
        const normalized = typeof value === "number" ? value : Number(value)
        return Number.isFinite(normalized) ? normalized : null
    } catch {
        return null
    }
}

function toPositiveNumber(value: unknown): number | null {
    const normalized = toFiniteNumber(value)
    return normalized !== null && normalized > 0 ? normalized : null
}

function unavailableProfile(
    productVariantId: string,
    status: Exclude<CartLogisticsProfileStatus, "READY">,
): CartLogisticsProfile {
    return { productVariantId, status, logistics: null }
}

/**
 * Tek sorgunun sonucunu, dışarıya güvenle açılabilecek lojistik profillerine çevirir.
 *
 * Repository yalnız `isActive: true` tedarikçi satırlarını getirdiği için burada
 * dizinin uzunluğu aktif profil durumunu belirler. Sessiz tedarikçi fallback'i
 * yapılmaz: sıfır ve çoklu aktif satır ayrı statülerdir.
 */
export function normalizeCartLogisticsProfiles(
    variantIds: readonly string[],
    rows: readonly CartLogisticsVariantRow[],
): CartLogisticsProfile[] {
    const rowsById = new Map(rows.map((row) => [row.id, row]))

    return normalizeCartLogisticsVariantIds(variantIds).map((productVariantId) => {
        const row = rowsById.get(productVariantId)
        if (!row) return unavailableProfile(productVariantId, "NOT_FOUND")

        if (row.variantSuppliers.length === 0) {
            return unavailableProfile(productVariantId, "NO_ACTIVE_SUPPLIER")
        }

        if (row.variantSuppliers.length > 1) {
            return unavailableProfile(productVariantId, "AMBIGUOUS_ACTIVE_SUPPLIER")
        }

        const supplier = row.variantSuppliers[0]
        const unitsPerPackage = toPositiveNumber(supplier.unitsPerPackage)
        const packageLengthMm = toPositiveNumber(supplier.packageLengthMm)
        const packageWidthMm = toPositiveNumber(supplier.packageWidthMm)
        const packageHeightMm = toPositiveNumber(supplier.packageHeightMm)

        if (
            unitsPerPackage === null
            || !Number.isInteger(unitsPerPackage)
            || packageLengthMm === null
            || packageWidthMm === null
            || packageHeightMm === null
        ) {
            return unavailableProfile(productVariantId, "INCOMPLETE_PACKAGE_DATA")
        }

        const packageWeightKg = toPositiveNumber(supplier.packageWeightKg)

        return {
            productVariantId,
            status: "READY",
            logistics: {
                unitsPerPackage,
                packageVolumeM3: (packageLengthMm * packageWidthMm * packageHeightMm) / 1_000_000_000,
                // Ağırlık bilgi amaçlıdır; eksik/geçersiz olması hacim profilini bozmaz.
                packageWeightKg,
            },
        }
    })
}
