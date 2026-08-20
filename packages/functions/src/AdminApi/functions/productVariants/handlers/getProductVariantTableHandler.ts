import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IListProductVariantsEvent } from "@/functions/AdminApi/types/productVariants"
import { safeNumber } from "@/core/helpers/utils/number"
import { flattenProductVariantStructure } from "@/core/helpers/productVariants/flattenVariantStructure"

export const getProductVariantTableHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IListProductVariantsEvent) => {
        const { page, limit, search, sort, order, productId } = event.queryStringParameters ?? {}

        const result = await productVariantRepository.listProductVariants({
            page: safeNumber(page),
            limit: safeNumber(limit),
            search,
            sort,
            order,
            productId,
        })

        // Optimize the payload by removing unnecessary fields
        const optimizedData = result.data.map(variant => {
            const structure = flattenProductVariantStructure(variant)
            return {
            id: variant.id,
            productId: variant.productId,
            name: variant.name,
            fullCode: variant.fullCode,
            sizeCode: structure.sizeCode,
            versionCode: structure.versionCode,
            createdAt: variant.createdAt,
            color: structure.color ? {
                id: structure.color.id,
                name: structure.color.name,
                hex: structure.color.hex,
                code: structure.color.code,
                system: structure.color.system,
            } : null,
            materials: structure.materials.map((m: any) => ({
                id: m.id,
                name: m.name,
            })),
            variantSuppliers: variant.variantSuppliers.map(vs => ({
                id: vs.id,
                variantId: vs.variantId,
                supplierId: vs.supplierId,
                isActive: vs.isActive,
                price: vs.price,
                operationalCostRate: (vs as any).operationalCostRate,
                netCost: (vs as any).netCost,
                profitRate: (vs as any).profitRate,
                listPrice: (vs as any).listPrice,
                paymentTermDays: (vs as any).paymentTermDays,
                supplierVariantCode: (vs as any).supplierVariantCode,
                supplierCode: (vs as any).supplierCode,
                fullCode: (vs as any).fullCode,
                hasSupplierLogo: (vs as any).hasSupplierLogo,
                unitsPerPackage: (vs as any).unitsPerPackage,
                packageLengthMm: (vs as any).packageLengthMm,
                packageWidthMm: (vs as any).packageWidthMm,
                packageHeightMm: (vs as any).packageHeightMm,
                packageWeightKg: (vs as any).packageWeightKg,
                minLeadTimeDays: (vs as any).minLeadTimeDays,
                supplierNote: (vs as any).supplierNote,
                minOrderQty: (vs as any).minOrderQty,
                stockQty: (vs as any).stockQty,
                pricingUpdatedAt: (vs as any).pricingUpdatedAt,
                availabilityUpdatedAt: (vs as any).availabilityUpdatedAt,
                currency: vs.currency,
                supplier: {
                    id: vs.supplier.id,
                    name: vs.supplier.name,
                }
            })),
            measurements: structure.measurements.map((m) => ({
                id: m.id,
                value: m.value,
                label: m.label,
                unit: m.unit,
                measurementType: m.measurementType ? {
                    id: m.measurementType.id,
                    code: m.measurementType.code,
                    name: m.measurementType.name,
                    displayOrder: m.measurementType.displayOrder,
                } : null,
            }))
            }
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: optimizedData,
                meta: result.meta,
            },
        })
    }
}
