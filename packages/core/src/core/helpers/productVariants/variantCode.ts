/**
 * Varyant kod sistemi — TEK KAYNAK.
 *
 * Kod biçimi:
 *   ProductVariant.fullCode          →  "10.5.8.V1"
 *   ProductVariantSupplier.fullCode  →  "10.5.8.V1.A"
 *
 * Segmentler:
 *   10   kategori kodu    ─┬─ `Product.code` ("10.5"), olduğu gibi kullanılır
 *   5    ürün modeli kodu ─┘
 *   8    ölçü kodu        — `ProductSize.code`; ürün modeli içinde tekil, küçükten büyüğe
 *   V1   versiyon         — `ProductVersion.code`; renk + hammadde kombinasyonu
 *   A    tedarikçi harfi  — `ProductSupplierCode.code`; ürün modeli içinde tekil, append-only
 *
 * ESKİ biçim `10.5.A.V1.8` idi: tedarikçi 3., ölçü 5. segmentteydi ve ölçü kodu
 * operatörün elle girdiği bir sayıydı (`ProductVariant.variantIndex`). Bu yüzden
 * aynı fiziksel ölçü farklı tedarikçi kataloglarından girildiğinde her seferinde
 * yeni bir kod alabiliyordu. Yeni biçimde ölçü kodu ölçünün KENDİSİNDEN türer
 * (bkz. sizeSignature.ts) ve ürün modeli içinde tektir.
 *
 * Bu modül saftır: I/O yok, Prisma yok. Kod şablonu daha önce dört ayrı yerde
 * elle kuruluyordu (iki admin handler, businessRequests/service.ts ve frontend
 * önizlemesi); hepsi buraya bağlanır.
 */

/** `ProductVersion.code` sayısının kod içindeki ön eki. */
export const VERSION_CODE_PREFIX = "V"

const VERSION_CODE_PATTERN = /^V([1-9][0-9]*)$/
const SIZE_CODE_PATTERN = /^[1-9][0-9]*$/
const SUPPLIER_CODE_PATTERN = /^[A-Z]+$/
const PRODUCT_CODE_SEGMENT_PATTERN = /^[0-9]+$/

const LETTER_COUNT = 26
const LETTER_A = "A".charCodeAt(0)

/**
 * Versiyon sırasını kod metnine çevirir: 1 → "V1".
 * @throws RangeError — sıra 1'den küçük veya tam sayı değilse.
 */
export function formatVersionCode(order: number): string {
    if (!Number.isInteger(order) || order < 1) {
        throw new RangeError(`version order must be a positive integer, received: ${order}`)
    }
    return `${VERSION_CODE_PREFIX}${order}`
}

/** "V1" → 1. Biçim tutmuyorsa null. */
export function parseVersionCode(value: string): number | null {
    const match = value.trim().toUpperCase().match(VERSION_CODE_PATTERN)
    return match ? Number(match[1]) : null
}

/**
 * Tedarikçi sırasını harfe çevirir — bijektif 26 tabanı (Excel kolon mantığı):
 * 1 → "A", 26 → "Z", 27 → "AA", 52 → "AZ", 53 → "BA".
 *
 * Ürün modeli başına 26'dan fazla tedarikçi beklenmiyor; yine de taşma sessizce
 * bozulmasın diye çok harfli devam eder.
 *
 * @throws RangeError — sıra 1'den küçük veya tam sayı değilse.
 */
export function formatSupplierCode(order: number): string {
    if (!Number.isInteger(order) || order < 1) {
        throw new RangeError(`supplier order must be a positive integer, received: ${order}`)
    }

    let remaining = order
    let code = ""

    while (remaining > 0) {
        const remainder = (remaining - 1) % LETTER_COUNT
        code = String.fromCharCode(LETTER_A + remainder) + code
        remaining = Math.floor((remaining - 1) / LETTER_COUNT)
    }

    return code
}

/** "A" → 1, "AA" → 27. Biçim tutmuyorsa null. */
export function parseSupplierCode(value: string): number | null {
    const normalized = value.trim().toUpperCase()
    if (!SUPPLIER_CODE_PATTERN.test(normalized)) return null

    let order = 0
    for (const character of normalized) {
        order = order * LETTER_COUNT + (character.charCodeAt(0) - LETTER_A + 1)
    }
    return order
}

/**
 * Mevcut harfleri görüp sıradaki BOŞ harfi verir.
 *
 * Tedarikçi harfleri her zaman append-only'dur (kilit durumundan bağımsız): bir
 * tedarikçinin harfi bir kez verildikten sonra asla değişmez, çünkü o harf
 * tedarikçiyle yapılan yazışmalarda ve kataloglarda geçer. Aradan bir tedarikçi
 * çıkarılırsa boşluğu DOLDURMAYIZ — en büyük harften devam ederiz.
 */
export function nextSupplierCode(existing: readonly string[]): string {
    let highest = 0

    for (const code of existing) {
        const order = parseSupplierCode(code)
        if (order !== null && order > highest) highest = order
    }

    return formatSupplierCode(highest + 1)
}

export type VariantFullCodeParts = {
    /** `Product.code` — "10.5" (nokta içerir). */
    productCode: string
    /** `ProductSize.code` — 8 */
    sizeCode: number
    /** `ProductVersion.code` sırası — 1 ("V1" değil). */
    versionOrder: number
}

/** "10.5" + 8 + 1 → "10.5.8.V1" */
export function buildVariantFullCode({ productCode, sizeCode, versionOrder }: VariantFullCodeParts): string {
    const normalizedProductCode = productCode.trim()
    if (!normalizedProductCode) {
        throw new RangeError("product code must not be empty")
    }
    if (!Number.isInteger(sizeCode) || sizeCode < 1) {
        throw new RangeError(`size code must be a positive integer, received: ${sizeCode}`)
    }

    return `${normalizedProductCode}.${sizeCode}.${formatVersionCode(versionOrder)}`
}

/** "10.5.8.V1" + "A" → "10.5.8.V1.A" */
export function buildVariantSupplierFullCode(variantFullCode: string, supplierCode: string): string {
    const normalizedVariantCode = variantFullCode.trim()
    const normalizedSupplierCode = supplierCode.trim().toUpperCase()

    if (!normalizedVariantCode) {
        throw new RangeError("variant full code must not be empty")
    }
    if (!SUPPLIER_CODE_PATTERN.test(normalizedSupplierCode)) {
        throw new RangeError(`supplier code must be A-Z letters, received: ${supplierCode}`)
    }

    return `${normalizedVariantCode}.${normalizedSupplierCode}`
}

export type ParsedVariantFullCode = VariantFullCodeParts & {
    /** Tedarikçili kodda dolu, varyant kodunda null. */
    supplierCode: string | null
}

/**
 * Kodu bileşenlerine ayırır. SONDAN başlar — `Product.code` nokta içerdiği ve
 * segment sayısı sabit olmadığı için baştan saymak güvenli değil.
 *
 * (Bu, `SuppliersPageClient.tsx`'teki `fullCode.split(".").slice(0, 2)` hack'inin
 * yerini alır.)
 */
export function parseVariantFullCode(fullCode: string): ParsedVariantFullCode | null {
    const segments = fullCode.trim().toUpperCase().split(".")
    if (segments.length < 4) return null

    let supplierCode: string | null = null
    if (SUPPLIER_CODE_PATTERN.test(segments[segments.length - 1])) {
        supplierCode = segments.pop() as string
    }
    if (segments.length < 4) return null

    const versionOrder = parseVersionCode(segments.pop() as string)
    if (versionOrder === null) return null

    const sizeSegment = segments.pop() as string
    if (!SIZE_CODE_PATTERN.test(sizeSegment)) return null

    if (segments.length < 2 || !segments.every((segment) => PRODUCT_CODE_SEGMENT_PATTERN.test(segment))) {
        return null
    }

    return {
        productCode: segments.join("."),
        sizeCode: Number(sizeSegment),
        versionOrder,
        supplierCode,
    }
}
