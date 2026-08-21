/**
 * Ürün modeli genelinde kod bakımı: ölçü anahtarlarını yeniden üret ve kodları
 * yeniden hesapla.
 *
 * İki yerden çağrılır:
 *  - Ölçü ŞABLONU değiştiğinde. `signature` ve `sortKey` şablondaki etiket, ölçü
 *    kodu ve `sortPriority`'den türer; şablon değişip anahtarlar yenilenmezse
 *    sıralama sessizce bayatlar ve "küçükten büyüğe" kuralı bozulur.
 *  - Açık "yeniden numaralandır" eyleminde (kilitli üründe bile).
 */

import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { chunkForBulkWrite } from "@/core/helpers/products/industrialUsageFunctionPlan"
import {
    assignProductVariantCodes,
    type PlannerSupplierCode,
    type PlannerVariant,
    type PlannerVariantSupplier,
    type PlannerVersion,
} from "./assignProductVariantCodes"
import { buildSizeSignature, buildSizeSortKey, type MeasurementRequirementLike } from "./sizeSignature"
import { negateProductVariantCodes, writeProductVariantCodes } from "./writeProductVariantCodes"

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type ProductVariantMaintenanceResult = {
    productId: string
    isLocked: boolean
    resortedSizes: number
    rewrittenCodes: number
}

/**
 * @param forceRenumber Kilidi YOK SAYAR ve tüm kodları baştan verir. Yalnız açık,
 * uyarılı bir yönetici eyleminden çağrılmalıdır — kodlar katalog/teklif/sipariş
 * üzerinden dışarı çıkmışsa geçmişi bozar.
 */
export async function recalculateProductVariantCodes(
    tx: TransactionClient,
    productId: string,
    options: { forceRenumber?: boolean } = {},
): Promise<ProductVariantMaintenanceResult> {
    const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, code: true, variantCodesLockedAt: true },
    })
    if (!product) throw new createError.NotFound("Product not found")

    const isLocked = options.forceRenumber ? false : product.variantCodesLockedAt !== null

    const requirementRows = await tx.productMeasurementRequirement.findMany({
        where: { productId },
        include: { measurementType: { select: { code: true } } },
    })
    const requirements: MeasurementRequirementLike[] = requirementRows.map((requirement) => ({
        id: requirement.id,
        measurementCode: requirement.measurementType.code,
        label: requirement.label,
        sortPriority: requirement.sortPriority,
        displayOrder: requirement.displayOrder,
    }))

    const sizes = await tx.productSize.findMany({
        where: { productId },
        select: {
            id: true,
            code: true,
            signature: true,
            sortKey: true,
            values: { select: { requirementId: true, value: true } },
        },
    })

    // 1) Anahtarları şablonun GÜNCEL hâline göre yeniden üret.
    const resorted: Array<{ id: string; signature: string; sortKey: string }> = []
    const plannerSizes = sizes.map((size) => {
        if (size.values.length === 0 || requirements.length === 0) {
            return { id: size.id, signature: size.signature, sortKey: size.sortKey, code: size.code }
        }

        const signature = buildSizeSignature(size.values, requirements)
        const sortKey = buildSizeSortKey(size.values, requirements)

        if (signature !== size.signature || sortKey !== size.sortKey) {
            resorted.push({ id: size.id, signature, sortKey })
        }
        return { id: size.id, signature, sortKey, code: size.code }
    })

    for (const chunk of chunkForBulkWrite(resorted)) {
        const ids = chunk.map((entry) => entry.id)
        const signatures = chunk.map((entry) => entry.signature)
        const sortKeys = chunk.map((entry) => entry.sortKey)
        await tx.$executeRaw`
            UPDATE "ProductSize" AS target
            SET "signature" = source.signature, "sortKey" = source.sort_key, "updatedAt" = NOW()
            FROM UNNEST(${ids}::text[], ${signatures}::text[], ${sortKeys}::text[])
                AS source(id, signature, sort_key)
            WHERE target."id" = source.id
        `
    }

    // 2) Kodları yeniden planla.
    const [versionRows, supplierCodeRows, variantRows] = await Promise.all([
        tx.productVersion.findMany({
            where: { productId },
            select: {
                id: true,
                code: true,
                signature: true,
                color: { select: { id: true, system: true, code: true } },
                materials: { select: { id: true, code: true, name: true } },
            },
        }),
        tx.productSupplierCode.findMany({
            where: { productId },
            select: { id: true, supplierId: true, code: true },
            orderBy: { createdAt: "asc" },
        }),
        tx.productVariant.findMany({
            where: { productId },
            select: {
                id: true,
                fullCode: true,
                productSizeId: true,
                productVersionId: true,
                variantSuppliers: { select: { id: true, supplierId: true, fullCode: true, supplierCode: true } },
            },
        }),
    ])

    const versions: PlannerVersion[] = versionRows.map((version) => ({
        id: version.id,
        signature: version.signature,
        code: version.code,
        color: version.color,
        materials: version.materials,
    }))
    const supplierCodes: PlannerSupplierCode[] = supplierCodeRows.map((entry, index) => ({
        id: entry.id,
        supplierId: entry.supplierId,
        code: entry.code,
        sequence: index,
    }))
    const variants: PlannerVariant[] = variantRows.map((variant) => ({
        id: variant.id,
        sizeId: variant.productSizeId,
        versionId: variant.productVersionId,
        fullCode: variant.fullCode,
        suppliers: variant.variantSuppliers as PlannerVariantSupplier[],
    }))

    const plan = assignProductVariantCodes({
        productCode: product.code,
        isLocked,
        sizes: plannerSizes,
        versions,
        supplierCodes,
        variants,
    })

    await negateProductVariantCodes(tx, plan)
    const stats = await writeProductVariantCodes(tx, productId, plan, { negationAlreadyApplied: true })

    return {
        productId,
        isLocked: product.variantCodesLockedAt !== null,
        resortedSizes: resorted.length,
        rewrittenCodes:
            stats.sizeCodes + stats.versionCodes + stats.variantCodes + stats.variantSupplierCodes,
    }
}

/**
 * Hiçbir varyantın kullanmadığı ölçü ve versiyon kayıtlarını siler.
 *
 * Varyant silindiğinde ölçüsü/versiyonu ortada kalır (`ProductVariant` → `Restrict`
 * olduğu için önce varyant gider). Bunlar temizlenmezse kod numaralarını işgal
 * etmeye devam eder: taslakta boşluk açar, kilitli üründe de sonraki ölçünün
 * gereksiz yere büyük numara almasına yol açar.
 */
export async function removeOrphanSizesAndVersions(
    tx: TransactionClient,
    productId: string,
): Promise<{ sizes: number; versions: number }> {
    const [sizes, versions] = await Promise.all([
        tx.productSize.deleteMany({ where: { productId, variants: { none: {} } } }),
        tx.productVersion.deleteMany({ where: { productId, variants: { none: {} } } }),
    ])

    return { sizes: sizes.count, versions: versions.count }
}
