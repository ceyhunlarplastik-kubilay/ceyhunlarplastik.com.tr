import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
const ALLOWED_SORT_FIELDS = ["name", "createdAt"];
export const listSuppliersHandler = ({ supplierRepository }) => {
    return async (event) => {
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "createdAt",
        });
        try {
            const result = await supplierRepository.listSuppliers({
                page,
                limit,
                search,
                sort,
                order,
                assignedPurchasingUserId: event.queryStringParameters?.assignedPurchasingUserId,
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            });
        }
        catch (err) {
            console.error(err);
            throw new createError.InternalServerError("Failed to list suppliers");
        }
    };
};
