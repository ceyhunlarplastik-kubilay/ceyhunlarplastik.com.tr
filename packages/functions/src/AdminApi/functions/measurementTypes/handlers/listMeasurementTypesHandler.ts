import createError from "http-errors"
import { safeNumber } from "@/core/helpers/utils/number"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IListMeasurementTypesDependencies,
    IListMeasurementTypesEvent,
} from "@/functions/AdminApi/types/measurementTypes"

export const listMeasurementTypesHandler = ({ measurementTypeRepository }: IListMeasurementTypesDependencies) => {
    return async (event: IListMeasurementTypesEvent) => {
        const { page, limit, search, sort, order } = event.queryStringParameters;

        try {
            const result =
                await measurementTypeRepository.listMeasurementTypes({
                    page: safeNumber(page),
                    limit: safeNumber(limit),
                    search,
                    sort,
                    order: order === "desc" ? "desc" : "asc",
                })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        } catch (err: any) {
            console.error(err)
            throw new createError.InternalServerError("Failed to list measurement types");
        }
    }
}

