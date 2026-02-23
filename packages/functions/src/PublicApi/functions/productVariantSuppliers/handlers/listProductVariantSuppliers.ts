import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IListProductVariantSuppliersEvent } from "@/functions/PublicApi/types/productVariantSuppliers"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["createdAt"] as const

export const listProductVariantSuppliersHandler = ({ productVariantSupplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IListProductVariantSuppliersEvent) => {
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
