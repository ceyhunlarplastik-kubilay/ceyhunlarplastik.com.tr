import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IListProductVariantsEvent } from "@/functions/AdminApi/types/productVariants"
import { safeNumber } from "@/core/helpers/utils/number"

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
        const optimizedData = result.data.map(variant => ({
            id: variant.id,
            productId: variant.productId,
            name: variant.name,
            fullCode: variant.fullCode,
            versionCode: variant.versionCode,
            supplierCode: variant.supplierCode,
            variantIndex: variant.variantIndex,
            createdAt: variant.createdAt,
            color: variant.color ? {
                id: variant.color.id,
                name: variant.color.name,
                hex: variant.color.hex,
                code: variant.color.code,
                system: variant.color.system,
            } : null,
            materials: variant.materials.map(m => ({
                id: m.id,
                name: m.name,
            })),
            variantSuppliers: variant.variantSuppliers.map(vs => ({
                id: vs.id,
                isActive: vs.isActive,
                price: vs.price,
                currency: vs.currency,
                supplier: {
                    id: vs.supplier.id,
                    name: vs.supplier.name,
                }
            })),
            measurements: variant.measurements.map(m => ({
                id: m.id,
                value: m.value,
                label: m.label,
                measurementType: {
                    id: m.measurementType.id,
                    code: m.measurementType.code,
                    name: m.measurementType.name,
                    displayOrder: m.measurementType.displayOrder,
                }
            }))
        }))

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: optimizedData,
                meta: result.meta,
            },
        })
    }
}
