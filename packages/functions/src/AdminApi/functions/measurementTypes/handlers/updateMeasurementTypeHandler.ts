import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, IUpdateMeasurementTypeEvent } from "@/functions/AdminApi/types/measurementTypes"
import {
    assertNoTranslationLocaleConflict,
    buildVariantDictionaryTranslationWrites,
    normalizeVariantDictionaryTranslations,
    VariantDictionaryTranslationInputError,
} from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

export const updateMeasurementTypeHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IUpdateMeasurementTypeEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const { translations, removeTranslationLocales, name, ...data } = body

            assertNoTranslationLocaleConflict(translations, removeTranslationLocales)

            const normalized = normalizeVariantDictionaryTranslations({
                legacyName: name,
                translations,
            })
            const translationWrites: Prisma.MeasurementTypeUpdateInput["translations"] =
                buildVariantDictionaryTranslationWrites({
                    translations: normalized.translations,
                    removeLocales: removeTranslationLocales,
                    buildWhere: (locale) => ({
                        measurementTypeId_locale: { measurementTypeId: id, locale },
                    }),
                })
            const updated =
                await measurementTypeRepository.updateMeasurementType(id, {
                    ...data,
                    ...(normalized.turkish && { name: normalized.turkish.name }),
                    ...(translationWrites && { translations: translationWrites }),
                })

            return apiResponseDTO({
                statusCode: 200,
                payload: { measurementType: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof VariantDictionaryTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Measurement type not found");
                if (err.code === "P2002") throw new createError.Conflict("Measurement type code already exists");
            }
            console.error(err)
            throw new createError.InternalServerError("Failed to update measurement type");
        }
    }
}
