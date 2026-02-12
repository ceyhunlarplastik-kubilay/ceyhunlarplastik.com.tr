import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IListProductSuppliersDependencies, IListProductSuppliersEvent } from "@/functions/AdminApi/types/productSuppliers"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["createdAt"] as const

export const listProductsSuppliersHandler = ({ productSupplierRepository }: IListProductSuppliersDependencies) => {
    return async (event: IListProductSuppliersEvent) => {

        const { page, limit } = normalizeListQuery(
            event.queryStringParameters,
            {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "createdAt",
            }
        )

        try {
            const result = await productSupplierRepository.listProductSuppliers({
                page,
                limit,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            })
        } catch (err) {
            console.error(err);
            throw new createError.InternalServerError("Failed to list product suppliers");
        }
    }
}
