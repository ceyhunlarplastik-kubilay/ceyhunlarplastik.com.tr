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
            // Public yüzey ham çevirileri OKUMUYOR (isim/slug zaten burada çözülüyor)
            // ama onlar payload'un %71.6'sıydı ve 2 MB'lık Next data-cache tavanını
            // aşırıp public layout'un cache'ini tamamen devre dışı bırakıyordu.
            // AdminApi'nin aynı route'u varsayılan (tam) davranışta kalır.
            const data = await productAttributeRepository.listAttributesForFilter(locale, {
                includeTranslations: false,
            })

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
