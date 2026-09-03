/**
 * Varyant satırı yazma servisi — ölçü/versiyon/tedarikçi sözlüklerini bul-ya-da-oluştur,
 * varyantı ve tedarikçi satırını yaz, ardından TÜM kodları yeniden hesapla.
 *
 * Hem tedarikçi varyant talebi onayı (`businessRequests/service.ts`) hem de
 * (Dilim 3'te) veri girişi matris endpoint'i buradan geçer — kod üretiminin tek
 * yolu olması, eski sistemde `fullCode`'un dört ayrı yerde elle kurulmasından
 * doğan sapmayı önler.
 *
 * TASARIM: kodlar HİÇBİR ŞEY YAZILMADAN ÖNCE planlanır. Yeni satırların id'leri
 * uygulamada (`randomUUID`) üretilir, planlayıcı mevcut + yeni satırların tamamını
 * görür ve nihai kodları döner; ancak ondan sonra INSERT/UPDATE yapılır. Böylece
 * ne geçici (placeholder) kod yazmak ne de kod kolonlarını nullable yapmak gerekir.
 */

import { randomUUID } from "node:crypto"

import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier"
import {
    assignProductVariantCodes,
    type PlannerSize,
    type PlannerSupplierCode,
    type PlannerVariant,
    type PlannerVariantSupplier,
    type PlannerVersion,
} from "./assignProductVariantCodes"
import {
    buildRequiredSignature,
    buildSizeSortKey,
    type MeasurementRequirementLike,
} from "./sizeSignature"
import { buildVersionSignature } from "./versionSignature"
import { negateProductVariantCodes, writeProductVariantCodes } from "./writeProductVariantCodes"

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type VariantRowSupplierInput = {
    supplierId: string
    isActive?: boolean
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
    paymentTermDays?: number
    supplierVariantCode?: string
    supplierNote?: string
    minOrderQty?: number
    stockQty?: number
    currency?: string
    hasSupplierLogo?: boolean
    unitsPerPackage?: number
    packageLengthMm?: number
    packageWidthMm?: number
    packageHeightMm?: number
    packageWeightKg?: number
    minLeadTimeDays?: number
}

export type VariantRowInput = {
    name: string
    /** Ürün modelinin ölçü şablonundaki gereksinimlere karşılık gelen değerler. */
    measurements: Array<{ requirementId: string; value: number }>
    colorId: string | null
    materialIds: string[]
    supplier?: VariantRowSupplierInput | null
}

export type UpsertProductVariantRowsResult = {
    productId: string
    /** Bu çağrının dokunduğu varyantlar — yeni oluşanlar ve tedarikçi eklenenler. */
    affectedVariantIds: string[]
    createdSizes: number
    createdSupplierCodes: number
    createdVariants: number
    createdVariantSuppliers: number
    rewrittenCodes: number
}

function toSupplierWriteData(supplier: VariantRowSupplierInput) {
    return {
        isActive: supplier.isActive ?? false,
        ...resolveProductVariantSupplierPricing({
            price: supplier.price,
            operationalCostRate: supplier.operationalCostRate,
            netCost: supplier.netCost,
            profitRate: supplier.profitRate,
            listPrice: supplier.listPrice,
        }),
        ...(typeof supplier.paymentTermDays === "number" ? { paymentTermDays: supplier.paymentTermDays } : {}),
        ...(supplier.supplierVariantCode ? { supplierVariantCode: supplier.supplierVariantCode.trim() } : {}),
        ...(supplier.supplierNote ? { supplierNote: supplier.supplierNote.trim() } : {}),
        ...(typeof supplier.minOrderQty === "number" ? { minOrderQty: supplier.minOrderQty } : {}),
        ...(typeof supplier.stockQty === "number" ? { stockQty: supplier.stockQty } : {}),
        ...(supplier.currency ? { currency: supplier.currency.toUpperCase() } : {}),
        ...(typeof supplier.hasSupplierLogo === "boolean" ? { hasSupplierLogo: supplier.hasSupplierLogo } : {}),
        ...(typeof supplier.unitsPerPackage === "number" ? { unitsPerPackage: supplier.unitsPerPackage } : {}),
        ...(typeof supplier.packageLengthMm === "number" ? { packageLengthMm: supplier.packageLengthMm } : {}),
        ...(typeof supplier.packageWidthMm === "number" ? { packageWidthMm: supplier.packageWidthMm } : {}),
        ...(typeof supplier.packageHeightMm === "number" ? { packageHeightMm: supplier.packageHeightMm } : {}),
        ...(typeof supplier.packageWeightKg === "number" ? { packageWeightKg: supplier.packageWeightKg } : {}),
        ...(typeof supplier.minLeadTimeDays === "number" ? { minLeadTimeDays: supplier.minLeadTimeDays } : {}),
        ...((typeof supplier.minOrderQty === "number" || typeof supplier.stockQty === "number")
            ? { availabilityUpdatedAt: new Date() }
            : {}),
    }
}

/**
 * Reddedilen satır için okunabilir kombinasyon açıklaması ("Siyah + Bakalit").
 * Yalnız hata yolunda çağrılır — mutlu yolda ek sorgu maliyeti yoktur.
 */
async function describeVersion(
    tx: TransactionClient,
    row: { colorId: string | null; materialIds: string[] },
): Promise<string> {
    const [color, materials] = await Promise.all([
        row.colorId ? tx.color.findUnique({ where: { id: row.colorId }, select: { name: true } }) : null,
        row.materialIds.length > 0
            ? tx.material.findMany({ where: { id: { in: row.materialIds } }, select: { name: true } })
            : [],
    ])

    const parts = [color?.name ?? "Renksiz", ...materials.map((material) => material.name)]
    return parts.join(" + ")
}

/**
 * Verilen satırları ürün modeline yazar ve ürünün TÜM varyant kodlarını yeniden
 * hesaplar. Çağıran bir transaction içinde olmalıdır.
 */
export async function upsertProductVariantRows(
    tx: TransactionClient,
    input: { productId: string; rows: readonly VariantRowInput[] },
): Promise<UpsertProductVariantRowsResult> {
    const { productId, rows } = input

    const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, code: true },
    })
    if (!product) throw new createError.NotFound("Product not found")

    const requirementRows = await tx.productMeasurementRequirement.findMany({
        where: { productId },
        include: { measurementType: { select: { code: true } } },
    })
    if (requirementRows.length === 0) {
        throw new createError.BadRequest(
            "Product has no measurement template; define required measurements before adding variants",
        )
    }

    const requirements: MeasurementRequirementLike[] = requirementRows.map((requirement) => ({
        id: requirement.id,
        measurementCode: requirement.measurementType.code,
        label: requirement.label,
        sortPriority: requirement.sortPriority,
        displayOrder: requirement.displayOrder,
        isRequired: requirement.isRequired,
    }))
    const requiredIds = requirementRows.filter((requirement) => requirement.isRequired).map((r) => r.id)

    const [existingSizes, existingVersions, existingSupplierCodes, existingVariants] = await Promise.all([
        tx.productSize.findMany({ where: { productId }, select: { id: true, code: true, signature: true, sortKey: true } }),
        // Ürün modeli için TANIMLI olan versiyonlar — kullanımdakiler değil.
        // Tanımsız bir kombinasyon aşağıda reddedilir, sessizce eklenmez.
        tx.variantVersion.findMany({
            where: { productId },
            select: { id: true, code: true, signature: true, colorId: true },
        }),
        tx.productSupplierCode.findMany({ where: { productId }, select: { id: true, supplierId: true, code: true } }),
        tx.productVariant.findMany({
            where: { productId },
            select: {
                id: true,
                fullCode: true,
                productSizeId: true,
                variantVersionId: true,
                variantSuppliers: { select: { id: true, supplierId: true, fullCode: true, supplierCode: true } },
            },
        }),
    ])

    /**
     * Ölçü tekilleştirme anahtarı: **ZORUNLU ölçü imzası** (`buildRequiredSignature`).
     *
     * Zorunlu ölçüleri aynı olan satırlar — opsiyonel bir ölçüsü farklı olsa ya da
     * hiç girilmese bile — TEK `ProductSize`'a, dolayısıyla tek 3. segment koduna
     * çözülür: `1.23.1.V1.A` / `.B` / `.C`. Tedarikçi anahtara GİRMEZ; aynı zorunlu
     * ölçüyü farklı tedarikçiler girdiğinde tek varyant + birden çok
     * `ProductVariantSupplier` oluşur.
     *
     * Eskiden anahtar "tüm dolu değerler + tedarikçi" idi; her tedarikçi aynı
     * fiziksel ölçü için ayrı kod alıyordu (`1.23.1 / 1.23.2 / 1.23.3`). Yeni kural
     * zorunlu ölçüleri eşleşenleri aynı kodda toplar.
     *
     * Opsiyonel ölçü değerleri yine `ProductSizeValue`'da tutulur; paylaşılan bir
     * ölçüye sonradan gelen opsiyonel değer var olana EKLENİR / üzerine yazılır
     * (son yazan kazanır), asla silinmez.
     *
     * `ProductSize.signature` kolonu ARTIK bu zorunlu imzayı saklar (eski "tüm dolu
     * değerler" imzasını değil — bkz. sizeSignature.ts ve backfill script'i).
     */
    const sizeByKey = new Map<string, { id: string; code: number; signature: string; sortKey: string }>()
    for (const size of existingSizes) {
        sizeByKey.set(size.signature, size)
    }
    const existingSizeIds = new Set(existingSizes.map((size) => size.id))
    const versionBySignature = new Map(existingVersions.map((version) => [version.signature, version]))
    const supplierCodeBySupplierId = new Map(existingSupplierCodes.map((entry) => [entry.supplierId, entry]))
    const variantBySizeVersion = new Map(
        existingVariants.map((variant) => [`${variant.productSizeId}#${variant.variantVersionId}`, variant]),
    )

    // ── Aşama 1: bellekte çözümle / hazırla (henüz hiçbir şey yazılmıyor) ────────
    const newSizes: Array<{ id: string; signature: string; sortKey: string; values: Array<{ requirementId: string; value: number }> }> = []
    /** Staged ölçünün değer dizisine referans — sonraki satırlar opsiyonel değer ekleyebilir. */
    const newSizeValuesById = new Map<string, Array<{ requirementId: string; value: number }>>()
    /** Mevcut bir ölçüye eklenecek/güncellenecek (özellikle opsiyonel) değerler. */
    const sizeValueUpsertsByKey = new Map<string, { productSizeId: string; requirementId: string; value: number }>()

    /**
     * Zorunlu imzası eşleşen bir ölçüye çözülen satırın taşıdığı değerleri o ölçüye
     * işler: staged ise dizisine katar, mevcutsa upsert kuyruğuna alır. Zorunlu
     * değerler zaten aynıdır; asıl kazanç opsiyonel ölçünün kaybolmamasıdır.
     */
    const mergeMeasurementValues = (
        sizeId: string,
        measurements: ReadonlyArray<{ requirementId: string; value: number }>,
    ) => {
        const stagedValues = newSizeValuesById.get(sizeId)
        if (stagedValues) {
            for (const measurement of measurements) {
                const existing = stagedValues.find((value) => value.requirementId === measurement.requirementId)
                if (existing) existing.value = measurement.value
                else stagedValues.push({ ...measurement })
            }
            return
        }
        if (!existingSizeIds.has(sizeId)) return
        for (const measurement of measurements) {
            sizeValueUpsertsByKey.set(`${sizeId}#${measurement.requirementId}`, {
                productSizeId: sizeId,
                requirementId: measurement.requirementId,
                value: measurement.value,
            })
        }
    }
    const newSupplierCodes: Array<{ id: string; supplierId: string; sequence: number }> = []
    const newVariants: Array<{ id: string; name: string; productSizeId: string; variantVersionId: string }> = []
    const newVariantSuppliers: Array<{ id: string; variantId: string; supplier: VariantRowSupplierInput }> = []
    const updatedVariantSuppliers: Array<{ id: string; supplier: VariantRowSupplierInput }> = []
    const affectedVariantIds = new Set<string>()

    const plannerSizes: PlannerSize[] = existingSizes.map((size) => ({
        id: size.id,
        signature: size.signature,
        sortKey: size.sortKey,
        code: size.code,
    }))
    const plannerVersions: PlannerVersion[] = []

    const plannerSupplierCodes: PlannerSupplierCode[] = existingSupplierCodes.map((entry, index) => ({
        id: entry.id,
        supplierId: entry.supplierId,
        code: entry.code,
        sequence: index,
    }))

    for (const row of rows) {
        const providedIds = new Set(row.measurements.map((measurement) => measurement.requirementId))
        const missing = requiredIds.filter((id) => !providedIds.has(id))
        if (missing.length > 0) {
            throw new createError.BadRequest(
                `Variant row "${row.name}" is missing required measurements: ${missing.join(", ")}`,
            )
        }

        const signature = buildRequiredSignature(row.measurements, requirements)
        const sortKey = buildSizeSortKey(row.measurements, requirements)

        let size = sizeByKey.get(signature)
        if (!size) {
            const values = [...row.measurements]
            const staged = { id: randomUUID(), code: null as unknown as number, signature, sortKey }
            sizeByKey.set(signature, staged)
            newSizes.push({ id: staged.id, signature, sortKey, values })
            newSizeValuesById.set(staged.id, values)
            plannerSizes.push({ id: staged.id, signature, sortKey, code: null })
            size = staged
        } else {
            mergeMeasurementValues(size.id, row.measurements)
        }

        const versionSignature = buildVersionSignature({ colorId: row.colorId, materialIds: row.materialIds })
        const version = versionBySignature.get(versionSignature)
        if (!version) {
            // ÖNCE TANIMLANMALI. Kombinasyonu burada sessizce numaralandırmak,
            // kod atamasını bir yan etkiye çevirirdi: operatör hangi numaranın
            // düştüğünü göremeden varyant yazılmış olurdu. Kod ataması bilinçli
            // bir karar; tanımı olmayan kombinasyon reddedilir.
            throw new createError.BadRequest(
                `Variant version is not defined for this product: ${await describeVersion(tx, row)}. Define it under the product's version dictionary first.`,
            )
        }

        if (row.supplier && !supplierCodeBySupplierId.has(row.supplier.supplierId)) {
            const staged = { id: randomUUID(), supplierId: row.supplier.supplierId, code: null as unknown as string }
            supplierCodeBySupplierId.set(row.supplier.supplierId, staged)
            newSupplierCodes.push({
                id: staged.id,
                supplierId: row.supplier.supplierId,
                sequence: plannerSupplierCodes.length,
            })
            plannerSupplierCodes.push({
                id: staged.id,
                supplierId: row.supplier.supplierId,
                code: null,
                sequence: plannerSupplierCodes.length,
            })
        }

        const variantKey = `${size.id}#${version.id}`
        let variant = variantBySizeVersion.get(variantKey)
        if (!variant) {
            const staged = {
                id: randomUUID(),
                fullCode: null as unknown as string,
                productSizeId: size.id,
                variantVersionId: version.id,
                variantSuppliers: [] as Array<{ id: string; supplierId: string; fullCode: string | null; supplierCode: string | null }>,
            }
            variantBySizeVersion.set(variantKey, staged)
            newVariants.push({ id: staged.id, name: row.name, productSizeId: size.id, variantVersionId: version.id })
            variant = staged
        }

        affectedVariantIds.add(variant.id)

        if (row.supplier) {
            const existingLink = variant.variantSuppliers.find((link) => link.supplierId === row.supplier!.supplierId)
            if (existingLink) {
                updatedVariantSuppliers.push({ id: existingLink.id, supplier: row.supplier })
            } else {
                const linkId = randomUUID()
                variant.variantSuppliers.push({
                    id: linkId,
                    supplierId: row.supplier.supplierId,
                    fullCode: null,
                    supplierCode: null,
                })
                newVariantSuppliers.push({ id: linkId, variantId: variant.id, supplier: row.supplier })
            }
        }
    }

    for (const version of existingVersions) {
        plannerVersions.push({ id: version.id, code: version.code })
    }

    const plannerVariants: PlannerVariant[] = [...variantBySizeVersion.values()].map((variant) => ({
        id: variant.id,
        sizeId: variant.productSizeId,
        versionId: variant.variantVersionId,
        fullCode: variant.fullCode ?? null,
        suppliers: variant.variantSuppliers as PlannerVariantSupplier[],
    }))

    const plan = assignProductVariantCodes({
        productCode: product.code,
        sizes: plannerSizes,
        versions: plannerVersions,
        supplierCodes: plannerSupplierCodes,
        variants: plannerVariants,
    })

    const sizeCodeById = new Map(plan.sizeCodeUpdates.map((update) => [update.id, update.code]))
    const supplierCodeById = new Map(plan.supplierCodeUpdates.map((update) => [update.id, update.code]))
    const variantFullCodeById = new Map(plan.variantCodeUpdates.map((update) => [update.id, update.fullCode]))
    const variantSupplierCodeById = new Map(plan.variantSupplierCodeUpdates.map((update) => [update.id, update]))

    // ── Aşama 2: yaz ────────────────────────────────────────────────────────────
    // Yeni satırlar NİHAİ kodlarıyla doğar. Bu yüzden MEVCUT satırların güncellenecek
    // kodları önce park edilir (bkz. negateProductVariantCodes), sonra insert'ler,
    // en sonda da nihai kod güncellemeleri yazılır.
    const newIds = new Set([
        ...newSizes.map((s) => s.id),
        ...newSupplierCodes.map((s) => s.id),
        ...newVariants.map((v) => v.id),
        ...newVariantSuppliers.map((v) => v.id),
    ])

    const updatePlan = {
        ...plan,
        sizeCodeUpdates: plan.sizeCodeUpdates.filter((update) => !newIds.has(update.id)),
        supplierCodeUpdates: plan.supplierCodeUpdates.filter((update) => !newIds.has(update.id)),
        variantCodeUpdates: plan.variantCodeUpdates.filter((update) => !newIds.has(update.id)),
        variantSupplierCodeUpdates: plan.variantSupplierCodeUpdates.filter((update) => !newIds.has(update.id)),
    }

    await negateProductVariantCodes(tx, updatePlan)

    if (newSizes.length > 0) {
        await tx.productSize.createMany({
            data: newSizes.map((size) => ({
                id: size.id,
                productId,
                code: sizeCodeById.get(size.id) as number,
                signature: size.signature,
                sortKey: size.sortKey,
            })),
        })
        await tx.productSizeValue.createMany({
            data: newSizes.flatMap((size) =>
                size.values.map((value) => ({
                    productSizeId: size.id,
                    requirementId: value.requirementId,
                    value: value.value,
                })),
            ),
        })
    }

    // Zorunlu imzası eşleştiği için mevcut bir ölçüye çözülen satırların (özellikle
    // opsiyonel) değerleri: yoksa ekle, varsa güncelle. Kuyruk küçüktür (yalnız
    // aynı zorunlu ölçüyü paylaşan satırlar) — satır başına upsert kabul edilebilir.
    for (const upsert of sizeValueUpsertsByKey.values()) {
        await tx.productSizeValue.upsert({
            where: {
                productSizeId_requirementId: {
                    productSizeId: upsert.productSizeId,
                    requirementId: upsert.requirementId,
                },
            },
            create: upsert,
            update: { value: upsert.value },
        })
    }

    if (newSupplierCodes.length > 0) {
        await tx.productSupplierCode.createMany({
            data: newSupplierCodes.map((entry) => ({
                id: entry.id,
                productId,
                supplierId: entry.supplierId,
                code: supplierCodeById.get(entry.id) as string,
            })),
        })
    }

    if (newVariants.length > 0) {
        await tx.productVariant.createMany({
            data: newVariants.map((variant) => ({
                id: variant.id,
                productId,
                name: variant.name,
                productSizeId: variant.productSizeId,
                variantVersionId: variant.variantVersionId,
                fullCode: variantFullCodeById.get(variant.id) as string,
            })),
        })
    }

    for (const link of newVariantSuppliers) {
        const codes = variantSupplierCodeById.get(link.id)
        await tx.productVariantSupplier.create({
            data: {
                id: link.id,
                variantId: link.variantId,
                supplierId: link.supplier.supplierId,
                ...(codes ? { fullCode: codes.fullCode, supplierCode: codes.supplierCode } : {}),
                ...toSupplierWriteData(link.supplier),
            },
        })
    }

    for (const link of updatedVariantSuppliers) {
        await tx.productVariantSupplier.update({
            where: { id: link.id },
            data: toSupplierWriteData(link.supplier),
        })
    }

    const writeStats = await writeProductVariantCodes(tx, productId, updatePlan, {
        negationAlreadyApplied: true,
    })

    return {
        productId,
        affectedVariantIds: [...affectedVariantIds],
        createdSizes: newSizes.length,
        createdSupplierCodes: newSupplierCodes.length,
        createdVariants: newVariants.length,
        createdVariantSuppliers: newVariantSuppliers.length,
        rewrittenCodes:
            writeStats.sizeCodes + writeStats.variantCodes + writeStats.variantSupplierCodes,
    }
}
