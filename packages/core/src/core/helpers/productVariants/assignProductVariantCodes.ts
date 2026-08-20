/**
 * Varyant kod atamasının SAF planlayıcısı — I/O yok, Prisma yok, tamamen test edilebilir.
 * Prisma'ya dokunan yüzey `writeProductVariantCodes.ts` içindedir ve bu modülü kullanır.
 *
 * Numaralandırma politikası ("taslak + kilitle"):
 *
 *  - **Taslak** (`Product.variantCodesLockedAt == null`): ürünün TÜM ölçüleri
 *    `sortKey`'e göre yeniden sıralanıp 1..N numaralanır, versiyonlar da
 *    deterministik sırayla V1..VN olur. Operatör veri girerken kodlar kendiliğinden
 *    düzelir — araya 11 cm eklendiğinde 12 cm bir sonraki numaraya kayar.
 *
 *  - **Kilitli**: mevcut hiçbir kod DEĞİŞMEZ. Yeni ölçü/versiyon `max + 1` alıp
 *    sona eklenir. Kilit, kodlar katalog/teklif/sipariş üzerinden dışarı çıktıktan
 *    sonra geçmişi bozmamak içindir.
 *
 *  - **Tedarikçi harfleri kilitten BAĞIMSIZ olarak her zaman append-only**'dır:
 *    bir tedarikçinin harfi verildikten sonra asla değişmez ve aradan bir tedarikçi
 *    çıkarılsa bile boşluk doldurulmaz (bkz. `nextSupplierCode`).
 *
 * Plan yalnız DEĞİŞEN satırları döndürür; değişmeyen kod boşuna yazılmaz.
 * `previousCode`/`previousFullCode` alanları writer'ın iki fazlı yazma (önce
 * negatifleme) gerekip gerekmediğine karar vermesi içindir — `@@unique([productId,
 * code])` bir unique INDEX olduğu için Postgres'te ertelenemez ve tek ifadede
 * yapılan 1↔2 takası çakışma verir.
 */

import {
    buildVariantFullCode,
    buildVariantSupplierFullCode,
    formatSupplierCode,
    parseSupplierCode,
} from "./variantCode"
import { compareSizeKeys } from "./sizeSignature"
import { compareVersionKeys, type VersionColorLike, type VersionMaterialLike } from "./versionSignature"

export type PlannerSize = {
    id: string
    signature: string
    sortKey: string
    /** Mevcut kod; yeni ölçüde null. */
    code: number | null
}

export type PlannerVersion = {
    id: string
    signature: string
    /** Mevcut kod; yeni versiyonda null. */
    code: number | null
    color: VersionColorLike | null
    materials: readonly VersionMaterialLike[]
}

export type PlannerSupplierCode = {
    id: string
    supplierId: string
    /** Mevcut harf; yeni tedarikçide null. */
    code: string | null
    /** İlk kullanım sırası — harfsizler bu sıraya göre harf alır. */
    sequence: number
}

export type PlannerVariantSupplier = {
    id: string
    supplierId: string
    fullCode: string | null
    supplierCode: string | null
}

export type PlannerVariant = {
    id: string
    sizeId: string
    versionId: string
    fullCode: string | null
    suppliers: readonly PlannerVariantSupplier[]
}

export type ProductVariantCodePlanInput = {
    /** `Product.code` — "10.5" */
    productCode: string
    /** `Product.variantCodesLockedAt != null` */
    isLocked: boolean
    sizes: readonly PlannerSize[]
    versions: readonly PlannerVersion[]
    supplierCodes: readonly PlannerSupplierCode[]
    variants: readonly PlannerVariant[]
}

export type SizeCodeUpdate = { id: string; code: number; previousCode: number | null }
export type VersionCodeUpdate = { id: string; code: number; previousCode: number | null }
export type SupplierCodeUpdate = { id: string; code: string }
export type VariantCodeUpdate = { id: string; fullCode: string; previousFullCode: string | null }
export type VariantSupplierCodeUpdate = {
    id: string
    supplierCode: string
    fullCode: string
    previousFullCode: string | null
}

export type ProductVariantCodePlan = {
    sizeCodeUpdates: SizeCodeUpdate[]
    versionCodeUpdates: VersionCodeUpdate[]
    supplierCodeUpdates: SupplierCodeUpdate[]
    variantCodeUpdates: VariantCodeUpdate[]
    variantSupplierCodeUpdates: VariantSupplierCodeUpdate[]
    /** Mevcut bir kodun ÜZERİNE yazılıyor mu — writer önce negatifleme fazı çalıştırmalı. */
    requiresSizeRenumber: boolean
    requiresVersionRenumber: boolean
    stats: {
        sizes: number
        versions: number
        supplierCodes: number
        variants: number
        variantSuppliers: number
    }
}

function assertUniqueCodes(codes: readonly (number | null)[], label: string): void {
    const seen = new Set<number>()
    for (const code of codes) {
        if (code === null) continue
        if (seen.has(code)) {
            throw new RangeError(`duplicate ${label} code detected before planning: ${code}`)
        }
        seen.add(code)
    }
}

function planSizeCodes(input: ProductVariantCodePlanInput): Map<string, SizeCodeUpdate | { code: number }> {
    assertUniqueCodes(input.sizes.map((size) => size.code), "size")

    const resolved = new Map<string, SizeCodeUpdate | { code: number }>()

    if (!input.isLocked) {
        const ordered = [...input.sizes].sort(compareSizeKeys)
        ordered.forEach((size, index) => {
            resolved.set(size.id, { id: size.id, code: index + 1, previousCode: size.code })
        })
        return resolved
    }

    let highest = 0
    for (const size of input.sizes) {
        if (size.code !== null) {
            resolved.set(size.id, { code: size.code })
            if (size.code > highest) highest = size.code
        }
    }

    const pending = input.sizes.filter((size) => size.code === null).sort(compareSizeKeys)
    for (const size of pending) {
        highest += 1
        resolved.set(size.id, { id: size.id, code: highest, previousCode: null })
    }

    return resolved
}

function planVersionCodes(input: ProductVariantCodePlanInput): Map<string, VersionCodeUpdate | { code: number }> {
    assertUniqueCodes(input.versions.map((version) => version.code), "version")

    const resolved = new Map<string, VersionCodeUpdate | { code: number }>()

    if (!input.isLocked) {
        const ordered = [...input.versions].sort(compareVersionKeys)
        ordered.forEach((version, index) => {
            resolved.set(version.id, { id: version.id, code: index + 1, previousCode: version.code })
        })
        return resolved
    }

    let highest = 0
    for (const version of input.versions) {
        if (version.code !== null) {
            resolved.set(version.id, { code: version.code })
            if (version.code > highest) highest = version.code
        }
    }

    const pending = input.versions.filter((version) => version.code === null).sort(compareVersionKeys)
    for (const version of pending) {
        highest += 1
        resolved.set(version.id, { id: version.id, code: highest, previousCode: null })
    }

    return resolved
}

function planSupplierCodes(input: ProductVariantCodePlanInput): {
    bySupplierId: Map<string, string>
    updates: SupplierCodeUpdate[]
} {
    const bySupplierId = new Map<string, string>()
    const updates: SupplierCodeUpdate[] = []
    const assigned: string[] = []

    for (const entry of input.supplierCodes) {
        if (entry.code === null) continue

        const normalized = entry.code.trim().toUpperCase()
        if (parseSupplierCode(normalized) === null) {
            throw new RangeError(`invalid supplier code stored for supplier ${entry.supplierId}: ${entry.code}`)
        }
        if (assigned.includes(normalized)) {
            throw new RangeError(`duplicate supplier code detected before planning: ${normalized}`)
        }

        assigned.push(normalized)
        bySupplierId.set(entry.supplierId, normalized)
    }

    const pending = [...input.supplierCodes]
        .filter((entry) => entry.code === null)
        .sort((left, right) => left.sequence - right.sequence || left.supplierId.localeCompare(right.supplierId))

    let highest = assigned.reduce((max, code) => Math.max(max, parseSupplierCode(code) ?? 0), 0)

    for (const entry of pending) {
        highest += 1
        const code = formatSupplierCode(highest)
        assigned.push(code)
        bySupplierId.set(entry.supplierId, code)
        updates.push({ id: entry.id, code })
    }

    return { bySupplierId, updates }
}

/**
 * Ürünün tüm kodlarını planlar. Girdi tutarsızsa (bilinmeyen ölçü/versiyon
 * referansı, çakışan kod, harfsiz tedarikçi) `RangeError` atar — sessizce bozuk
 * kod üretmektense yazma başlamadan durmak istenir.
 */
export function assignProductVariantCodes(input: ProductVariantCodePlanInput): ProductVariantCodePlan {
    const productCode = input.productCode.trim()
    if (!productCode) {
        throw new RangeError("product code must not be empty")
    }

    const sizeResolution = planSizeCodes(input)
    const versionResolution = planVersionCodes(input)
    const supplierResolution = planSupplierCodes(input)

    const sizeCodeUpdates: SizeCodeUpdate[] = []
    const versionCodeUpdates: VersionCodeUpdate[] = []

    for (const entry of sizeResolution.values()) {
        if ("id" in entry && entry.code !== entry.previousCode) sizeCodeUpdates.push(entry)
    }
    for (const entry of versionResolution.values()) {
        if ("id" in entry && entry.code !== entry.previousCode) versionCodeUpdates.push(entry)
    }

    const variantCodeUpdates: VariantCodeUpdate[] = []
    const variantSupplierCodeUpdates: VariantSupplierCodeUpdate[] = []
    const seenVariantFullCodes = new Set<string>()
    let variantSupplierCount = 0

    for (const variant of input.variants) {
        const size = sizeResolution.get(variant.sizeId)
        if (!size) throw new RangeError(`variant ${variant.id} references unknown size: ${variant.sizeId}`)

        const version = versionResolution.get(variant.versionId)
        if (!version) throw new RangeError(`variant ${variant.id} references unknown version: ${variant.versionId}`)

        const fullCode = buildVariantFullCode({
            productCode,
            sizeCode: size.code,
            versionOrder: version.code,
        })

        if (seenVariantFullCodes.has(fullCode)) {
            throw new RangeError(`duplicate variant full code produced: ${fullCode}`)
        }
        seenVariantFullCodes.add(fullCode)

        if (fullCode !== variant.fullCode) {
            variantCodeUpdates.push({ id: variant.id, fullCode, previousFullCode: variant.fullCode })
        }

        for (const supplier of variant.suppliers) {
            variantSupplierCount += 1

            const supplierCode = supplierResolution.bySupplierId.get(supplier.supplierId)
            if (!supplierCode) {
                throw new RangeError(
                    `variant supplier ${supplier.id} references a supplier without a product code: ${supplier.supplierId}`,
                )
            }

            const supplierFullCode = buildVariantSupplierFullCode(fullCode, supplierCode)
            if (supplierFullCode !== supplier.fullCode || supplierCode !== supplier.supplierCode) {
                variantSupplierCodeUpdates.push({
                    id: supplier.id,
                    supplierCode,
                    fullCode: supplierFullCode,
                    previousFullCode: supplier.fullCode,
                })
            }
        }
    }

    return {
        sizeCodeUpdates,
        versionCodeUpdates,
        supplierCodeUpdates: supplierResolution.updates,
        variantCodeUpdates,
        variantSupplierCodeUpdates,
        requiresSizeRenumber: sizeCodeUpdates.some((update) => update.previousCode !== null),
        requiresVersionRenumber: versionCodeUpdates.some((update) => update.previousCode !== null),
        stats: {
            sizes: input.sizes.length,
            versions: input.versions.length,
            supplierCodes: input.supplierCodes.length,
            variants: input.variants.length,
            variantSuppliers: variantSupplierCount,
        },
    }
}
