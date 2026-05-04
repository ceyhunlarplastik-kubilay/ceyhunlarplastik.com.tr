import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IListProductVariantSuppliersEvent } from "@/functions/AdminApi/types/productVariantSuppliers"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["createdAt"] as const

export const listProductVariantSuppliersHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IListProductVariantSuppliersEvent) => {
        const query = event.queryStringParameters ?? {}
        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "createdAt",
            })

        try {
            const result = await productVariantSupplierRepository.listProductVariantSuppliers({
                page,
                limit,
                search,
                sort,
                order,
                ...(query.variantId && { variantId: query.variantId }),
                ...(query.supplierId && { supplierId: query.supplierId }),
                ...(query.productId && { productId: query.productId }),
                ...(query.categoryId && { categoryId: query.categoryId }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        } catch (err) {
            console.error(err);
            throw new createError.InternalServerError("Failed to list product variant suppliers");
        }
    }
}
