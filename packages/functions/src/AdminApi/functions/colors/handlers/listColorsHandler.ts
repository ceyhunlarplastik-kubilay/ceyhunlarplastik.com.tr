import createError from "http-errors"
import { safeNumber } from "@/core/helpers/utils/number"
import { apiResponse, apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IListColorsDependencies, IListColorsEvent } from "@/functions/AdminApi/types/colors"

export const listColorsHandler = ({ colorRepository }: IListColorsDependencies) => {
    return async (event: IListColorsEvent) => {
        const { page, limit, search, sort, order } = event.queryStringParameters ?? {};
        try {
            const result = await colorRepository.listColors({
                page: safeNumber(page),
                limit: safeNumber(limit),
                search,
                sort,
                order: order === "desc" ? "desc" : "asc",
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            })
        } catch (err: any) {
            console.error(err)
            throw new createError.InternalServerError("An error occurred while listing colors");
        }
    }
}
