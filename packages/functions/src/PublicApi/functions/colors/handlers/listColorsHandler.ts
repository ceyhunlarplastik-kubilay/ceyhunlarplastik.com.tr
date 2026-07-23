import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import {
    localizeColor,
    withoutDictionaryTranslations,
} from "@/core/helpers/variantDictionaries/localizeVariantDictionary"
import { IColorDependencies, IListColorsEvent } from "@/functions/PublicApi/types/colors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

export const listColorsHandler = ({ colorRepository }: IColorDependencies) => {
    return async (event: IListColorsEvent) => {
        const locale = getSupportedLocale(event.queryStringParameters?.locale)
        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "code",
            })

        try {
            const result = await colorRepository.listColors({
                page,
                limit,
                search,
                sort,
                order,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map((color) =>
                        withoutDictionaryTranslations(localizeColor(color, locale)),
                    ),
                    meta: result.meta,
                },
            })
        } catch (err: any) {
            console.error(err)
            throw new createError.InternalServerError("An error occurred while listing colors");
        }
    }
}
