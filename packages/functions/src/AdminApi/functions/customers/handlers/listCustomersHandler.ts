import createError from "http-errors"
import { mapCustomerForApi } from "@/core/helpers/crm/mapCustomerForApi"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import {
    DATABASE_CONNECTION_CAPACITY_MESSAGE,
    isDatabaseConnectionCapacityError,
} from "@/core/helpers/prisma/errors"
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
                status: event.queryStringParameters?.status,
                assignedSalesUserId: event.queryStringParameters?.assignedSalesUserId,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map((customer) => mapCustomerForApi(customer)),
                    meta: result.meta,
                },
            })
        } catch (error) {
            console.error(error)
            if (isDatabaseConnectionCapacityError(error)) {
                throw new createError.ServiceUnavailable(DATABASE_CONNECTION_CAPACITY_MESSAGE)
            }

            throw new createError.InternalServerError("Failed to list customers")
        }
    }
}
