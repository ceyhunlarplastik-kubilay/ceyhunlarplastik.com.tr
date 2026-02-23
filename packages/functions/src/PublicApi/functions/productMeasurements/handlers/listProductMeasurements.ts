import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductMeasurementDependencies, IListProductMeasurementsEvent } from "@/functions/AdminApi/types/productMeasurements"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["value", "createdAt"] as const

export const listProductMeasurementsHandler = ({ productMeasurementRepository }: IProductMeasurementDependencies) => {
    return async (event: IListProductMeasurementsEvent) => {

        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "value",
            })

        try {
            const result = await productMeasurementRepository.listProductMeasurements({
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
        } catch (err) {
            console.error(err);
            throw new createError.InternalServerError("Failed to list product measurements");
        }
    }
}
