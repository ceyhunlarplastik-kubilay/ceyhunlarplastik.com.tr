import createError from "http-errors";
import { safeNumber } from "@/core/helpers/utils/number";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listColorsHandler = ({ colorRepository }) => {
    return async (event) => {
        const { page, limit, search, sort, order } = event.queryStringParameters ?? {};
        try {
            const result = await colorRepository.listColors({
                page: safeNumber(page),
                limit: safeNumber(limit),
                search,
                sort,
                order: order === "desc" ? "desc" : "asc",
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
            throw new createError.InternalServerError("An error occurred while listing colors");
        }
    };
};
