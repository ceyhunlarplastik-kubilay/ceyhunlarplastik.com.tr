import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import { mapMaterialWithAssets } from "@/core/helpers/assets/mapMaterialWithAssets"
import {
    localizeMaterial,
    withoutDictionaryTranslations,
} from "@/core/helpers/variantDictionaries/localizeVariantDictionary"
import type { IMaterialDependencies, IGetMaterialEvent } from "@/functions/PublicApi/types/materials"

export const getMaterialHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: IGetMaterialEvent) => {
        const { id } = event.pathParameters
        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        try {
            const material = await materialRepository.getMaterial(id)
            if (!material) throw new createError.NotFound("Material not found")

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    material: mapMaterialWithAssets(
                        withoutDictionaryTranslations(localizeMaterial(material, locale)),
                        { certificatesOnly: true },
                    ),
                },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error)
            throw new createError.InternalServerError("Failed to get material")
        }
    }
}
