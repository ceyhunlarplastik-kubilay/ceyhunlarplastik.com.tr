import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, IListMeasurementTypesEvent } from "@/functions/AdminApi/types/measurementTypes"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt", "displayOrder"] as const

export const listMeasurementTypesHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IListMeasurementTypesEvent) => {
        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "code",
            })

        try {
            const result = await measurementTypeRepository.listMeasurementTypes({
                page,
                limit,
                search,
                sort,
                order,
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

