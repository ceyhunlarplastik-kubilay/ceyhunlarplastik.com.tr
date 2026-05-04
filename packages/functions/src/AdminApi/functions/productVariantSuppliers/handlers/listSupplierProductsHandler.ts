import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { IProductVariantSupplierDependencies, IListSupplierProductsEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

const ALLOWED_SORT_FIELDS = ["name", "code", "createdAt", "updatedAt"] as const

export const listSupplierProductsHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IListSupplierProductsEvent) => {
        const query = event.queryStringParameters ?? {}
        const supplierId = query.supplierId

        if (!supplierId) {
            throw new createError.BadRequest("supplierId is required")
        }

        const { page, limit, search, sort, order } = normalizeListQuery(query, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "name",
        })

        try {
            const result = await productVariantSupplierRepository.listProductsBySupplier({
                supplierId,
                page,
                limit,
                search,
                sort,
                order,
                ...(query.categoryId && { categoryId: query.categoryId }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        } catch (error) {
            console.error(error)
            throw new createError.InternalServerError("Failed to list supplier products")
        }
    }
}

