import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, IListMeasurementTypesEvent } from "@/functions/AdminApi/types/measurementTypes"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { isMeasurementCode } from "@/core/helpers/productVariants/measurementCodes"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt", "displayOrder"] as const

export const listMeasurementTypesHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IListMeasurementTypesEvent) => {
        const rawQuery = event.queryStringParameters ?? {}
        const { page, limit, search, sort, order } =
            normalizeListQuery(rawQuery, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "code",
            })
        const { code, baseUnit } = rawQuery
        const normalizedCode = isMeasurementCode(code) ? code : undefined

        try {
            const result = await measurementTypeRepository.listMeasurementTypes({
                page,
                limit,
                search,
                sort,
                order,
                code: normalizedCode,
                baseUnit,
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
