import createError from "http-errors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICustomerDependencies, IListCustomersEvent } from "@/functions/AdminApi/types/customers"

const ALLOWED_SORT_FIELDS = ["fullName", "companyName", "email", "createdAt"] as const

export const listCustomersHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: IListCustomersEvent) => {
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "createdAt",
        })

        try {
            const result = await customerRepository.listCustomers({
                page,
                limit,
                search,
                sort,
                order,
                sectorValueId: event.queryStringParameters?.sectorValueId,
                productionGroupValueId: event.queryStringParameters?.productionGroupValueId,
                usageAreaValueId: event.queryStringParameters?.usageAreaValueId,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            })
        } catch (error) {
            console.error(error)
            throw new createError.InternalServerError("Failed to list customers")
        }
    }
}
