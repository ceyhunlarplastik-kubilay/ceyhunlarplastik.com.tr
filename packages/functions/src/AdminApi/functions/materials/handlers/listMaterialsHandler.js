import createError from "http-errors";
import { safeNumber } from "@/core/helpers/utils/number";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listMaterialsHandler = ({ materialRepository }) => {
    return async (event) => {
        const { page, limit, search, sort, order } = event.queryStringParameters ?? {};
        try {
            const result = await materialRepository.listMaterials({
                page: safeNumber(page),
                limit: safeNumber(limit),
                search,
                sort,
                order,
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            });
        }
        catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to list materials");
        }
    };
};
