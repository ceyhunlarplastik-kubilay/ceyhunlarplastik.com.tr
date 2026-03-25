import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductAttributeDependencies,
    IListAttributesWithValuesEvent,
} from "@/functions/PublicApi/types/productAttributes"

export const listAttributesWithValuesHandler = ({
    productAttributeRepository,
}: IProductAttributeDependencies) => {
    return async (_event: IListAttributesWithValuesEvent) => {
        try {
            const data = await productAttributeRepository.listAttributesForFilter()

            return apiResponseDTO({
                statusCode: 200,
                payload: { data },
            })
        } catch (error) {
            console.error(error)
            throw new createError.InternalServerError("Failed to list attributes with values")
        }
    }
}
