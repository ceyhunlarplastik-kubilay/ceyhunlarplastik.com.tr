import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { IListSuppliersDependencies, IListSuppliersEvent } from "@/functions/AdminApi/types/suppliers"

const ALLOWED_SORT_FIELDS = ["name", "createdAt"] as const

export const listSuppliersHandler = ({ supplierRepository }: IListSuppliersDependencies) => {
    return async (event: IListSuppliersEvent) => {

        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "createdAt",
            })

        try {
            const result = await supplierRepository.listSuppliers({
                page,
                limit,
                search,
                sort,
                order,
            })

            return apiResponse({
                statusCode: 200,
                payload: result,
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to list suppliers")
        }
    }
}
