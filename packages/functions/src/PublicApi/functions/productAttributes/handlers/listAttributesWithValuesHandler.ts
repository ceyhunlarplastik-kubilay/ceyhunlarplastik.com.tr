import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import {
    IProductAttributeDependencies,
    IListAttributesWithValuesEvent,
} from "@/functions/PublicApi/types/productAttributes"

export const listAttributesWithValuesHandler = ({
    productAttributeRepository,
}: IProductAttributeDependencies) => {
    return async (event: IListAttributesWithValuesEvent) => {
        try {
            const locale = getSupportedLocale(event.queryStringParameters?.locale)
            const data = await productAttributeRepository.listAttributesForFilter(locale)

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
