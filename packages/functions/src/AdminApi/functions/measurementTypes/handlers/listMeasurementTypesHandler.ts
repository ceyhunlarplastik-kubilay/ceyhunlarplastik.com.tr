import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, IListMeasurementTypesEvent } from "@/functions/AdminApi/types/measurementTypes"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt", "displayOrder"] as const
const MEASUREMENT_TYPE_CODES = [
    "D",
    "D1",
    "D2",
    "R",
    "R1",
    "R2",
    "L",
    "L1",
    "L2",
    "T",
    "A",
    "W",
    "H",
    "H1",
    "H2",
    "PT",
    "M",
    "R_L",
] as const

export const listMeasurementTypesHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IListMeasurementTypesEvent) => {
        const rawQuery = event.queryStringParameters ?? {}
        const { page, limit, search, sort, order } =
            normalizeListQuery(rawQuery, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "code",
            })
        const { code, baseUnit } = rawQuery
        const normalizedCode = MEASUREMENT_TYPE_CODES.includes(code as any) ? code : undefined

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
