import createError from "http-errors"
import { safeNumber } from "@/core/helpers/utils/number"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ColorSystem, IColorDependencies, IListColorsEvent } from "@/functions/AdminApi/types/colors"

const allowedColorSystems = new Set<string>(Object.values(ColorSystem))

export const listColorsHandler = ({ colorRepository }: IColorDependencies) => {
    return async (event: IListColorsEvent) => {
        const { page, limit, search, sort, order, system } = event.queryStringParameters ?? {};
        const normalizedSystem = system && allowedColorSystems.has(system) ? system : undefined

        try {
            const result = await colorRepository.listColors({
                page: safeNumber(page),
                limit: safeNumber(limit),
                search,
                sort,
                order: order === "desc" ? "desc" : "asc",
                system: normalizedSystem,
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
