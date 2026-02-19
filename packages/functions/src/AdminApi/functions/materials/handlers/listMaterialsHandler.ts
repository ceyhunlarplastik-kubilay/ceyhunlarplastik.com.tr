import createError from "http-errors"
import { safeNumber } from "@/core/helpers/utils/number"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMaterialDependencies, IListMaterialsEvent } from "@/functions/AdminApi/types/materials"

export const listMaterialsHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: IListMaterialsEvent) => {
        const { page, limit, search, sort, order } = event.queryStringParameters ?? {};

        try {
            const result = await materialRepository.listMaterials({
                page: safeNumber(page),
                limit: safeNumber(limit),
                search,
                sort,
                order,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to list materials");
        }
    }
}
