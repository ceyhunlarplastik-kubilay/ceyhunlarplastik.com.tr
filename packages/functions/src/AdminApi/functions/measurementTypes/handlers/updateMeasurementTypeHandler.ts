import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, IUpdateMeasurementTypeEvent } from "@/functions/AdminApi/types/measurementTypes"
import { DEFAULT_LOCALE } from "@/core/i18n/locales"
import {
    normalizeVariantDictionaryTranslations,
    VariantDictionaryTranslationInputError,
} from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

export const updateMeasurementTypeHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IUpdateMeasurementTypeEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const { translations, name, ...data } = body
            const normalized = normalizeVariantDictionaryTranslations({
                legacyName: name,
                translations,
            })
            const translationWrites: Prisma.MeasurementTypeUpdateInput["translations"] =
                normalized.turkish || normalized.createOnlyTranslations.length > 0
                    ? {
                        ...(normalized.turkish && {
                            upsert: {
                                where: {
                                    measurementTypeId_locale: {
                                        measurementTypeId: id,
                                        locale: DEFAULT_LOCALE,
                                    },
                                },
                                create: normalized.turkish,
                                update: {
                                    name: normalized.turkish.name,
                                },
                            },
                        }),
                        ...(normalized.createOnlyTranslations.length > 0 && {
                            connectOrCreate: normalized.createOnlyTranslations.map((translation) => ({
                                where: {
                                    measurementTypeId_locale: {
                                        measurementTypeId: id,
                                        locale: translation.locale,
                                    },
                                },
                                create: translation,
                            })),
                        }),
                    }
                    : undefined
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
