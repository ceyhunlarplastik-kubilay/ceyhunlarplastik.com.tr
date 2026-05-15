import createError from "http-errors";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
const ALLOWED_SORT_FIELDS = ["fullName", "companyName", "email", "createdAt"];
export const listCustomersHandler = ({ customerRepository }) => {
    return async (event) => {
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "createdAt",
        });
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
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            });
        }
        catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to list customers");
        }
    };
};
