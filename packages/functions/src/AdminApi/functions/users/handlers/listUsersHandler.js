import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
const ALLOWED_SORT_FIELDS = ["email", "identifier", "createdAt"];
const ALLOWED_ACCESS_STATUSES = new Set(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]);
export const listUsersHandler = ({ userRepository }) => async (event) => {
    const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
        allowedSortFields: ALLOWED_SORT_FIELDS,
        defaultSort: "createdAt",
    });
    const accessStatusRaw = event.queryStringParameters?.accessStatus;
    const accessStatus = accessStatusRaw && ALLOWED_ACCESS_STATUSES.has(accessStatusRaw)
        ? accessStatusRaw
        : undefined;
    const result = await userRepository.listUsers({
        page,
        limit,
        search,
        sort,
        order,
        accessStatus,
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: {
            data: result.data,
            meta: result.meta,
        },
    });
};
