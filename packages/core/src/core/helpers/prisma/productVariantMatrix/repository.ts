import { prisma } from "@/core/db/prisma"
import { formatVersionCode } from "@/core/helpers/productVariants/variantCode"

/**
 * Varyant matris ekranının TEK okuma yüzeyi.
 *
 * Operatör bir ürün modeli seçtiğinde ekranın ihtiyaç duyduğu her şeyi tek çağrıda
 * döner: ölçü şablonu (tablo kolonlarını belirler), mevcut ölçü/versiyon/tedarikçi
 * sözlükleri ve satırlar.
 *
 * Payload DAR TUTULUR: yalnız ekranda gösterilecek alanlar seçilir. Renk/hammadde/
 * tedarikçi referans listeleri buraya DAHİL DEĞİLDİR — onlar zaten
 * `/product-variants/references` üzerinden ayrı ve önbelleklenebilir biçimde geliyor.
 */

export type ProductVariantMatrix = Awaited<ReturnType<IPrismaProductVariantMatrixRepository["getMatrix"]>>

export interface IPrismaProductVariantMatrixRepository {
    getMatrix(productId: string): Promise<{
        product: {
            id: string
            code: string
            name: string
            variantCodesLockedAt: Date | null
        }
        requirements: Array<{
            id: string
            measurementTypeId: string
            measurementCode: string
            label: string
            unit: string | null
            isRequired: boolean
            sortPriority: number
            displayOrder: number
        }>
        sizes: Array<{ id: string; code: number; values: Array<{ requirementId: string; value: number }> }>
        versions: Array<{ id: string; code: string; colorId: string | null; materialIds: string[] }>
        supplierCodes: Array<{ id: string; supplierId: string; supplierName: string; code: string }>
        rows: Array<{
            variantId: string
            fullCode: string
            name: string
            sizeId: string
            versionId: string
            suppliers: Array<Record<string, unknown>>
        }>
    } | null>
}

export const productVariantMatrixRepository = (): IPrismaProductVariantMatrixRepository => {
    const getMatrix = async (productId: string) => {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, code: true, name: true, variantCodesLockedAt: true },
        })
        if (!product) return null

        const [requirementRows, sizeRows, versionRows, supplierCodeRows, variantRows] = await Promise.all([
            prisma.productMeasurementRequirement.findMany({
                where: { productId },
                orderBy: [{ sortPriority: "asc" }, { displayOrder: "asc" }, { label: "asc" }],
                select: {
                    id: true,
                    measurementTypeId: true,
                    label: true,
                    unit: true,
                    isRequired: true,
                    sortPriority: true,
                    displayOrder: true,
                    measurementType: { select: { code: true, baseUnit: true } },
                },
            }),
            prisma.productSize.findMany({
                where: { productId },
                orderBy: { code: "asc" },
                select: {
                    id: true,
                    code: true,
                    values: { select: { requirementId: true, value: true } },
                },
            }),
            prisma.productVersion.findMany({
                where: { productId },
                orderBy: { code: "asc" },
                select: {
                    id: true,
                    code: true,
                    colorId: true,
                    materials: { select: { id: true } },
                },
            }),
            prisma.productSupplierCode.findMany({
                where: { productId },
                orderBy: { code: "asc" },
                select: { id: true, supplierId: true, code: true, supplier: { select: { name: true } } },
            }),
            prisma.productVariant.findMany({
                where: { productId },
                orderBy: [{ size: { code: "asc" } }, { version: { code: "asc" } }],
                select: {
                    id: true,
                    fullCode: true,
                    name: true,
                    productSizeId: true,
                    productVersionId: true,
                    variantSuppliers: {
                        orderBy: { supplierCode: "asc" },
                        select: {
                            id: true,
                            supplierId: true,
                            supplierCode: true,
                            fullCode: true,
                            isActive: true,
                            price: true,
                            operationalCostRate: true,
                            netCost: true,
                            profitRate: true,
                            listPrice: true,
                            currency: true,
                            paymentTermDays: true,
                            supplierVariantCode: true,
                            supplierNote: true,
                            minOrderQty: true,
                            stockQty: true,
                            hasSupplierLogo: true,
                            unitsPerPackage: true,
                            packageLengthMm: true,
                            packageWidthMm: true,
                            packageHeightMm: true,
                            packageWeightKg: true,
                            minLeadTimeDays: true,
                        },
                    },
                },
            }),
        ])

        return {
            product,
            requirements: requirementRows.map((requirement) => ({
                id: requirement.id,
                measurementTypeId: requirement.measurementTypeId,
                measurementCode: requirement.measurementType.code,
                label: requirement.label,
                // Birim şablonda ezilebilir; yoksa ölçü tipinin taban birimi.
                unit: requirement.unit ?? requirement.measurementType.baseUnit,
                isRequired: requirement.isRequired,
                sortPriority: requirement.sortPriority,
                displayOrder: requirement.displayOrder,
            })),
            sizes: sizeRows,
            versions: versionRows.map((version) => ({
                id: version.id,
                code: formatVersionCode(version.code),
                colorId: version.colorId,
                materialIds: version.materials.map((material) => material.id),
            })),
            supplierCodes: supplierCodeRows.map((entry) => ({
                id: entry.id,
                supplierId: entry.supplierId,
                supplierName: entry.supplier.name,
                code: entry.code,
            })),
            rows: variantRows.map((variant) => ({
                variantId: variant.id,
                fullCode: variant.fullCode,
                name: variant.name,
                sizeId: variant.productSizeId,
                versionId: variant.productVersionId,
                suppliers: variant.variantSuppliers as Array<Record<string, unknown>>,
            })),
        }
    }

    return { getMatrix }
}
