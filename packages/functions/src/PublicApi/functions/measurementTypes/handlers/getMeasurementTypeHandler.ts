import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import {
    localizeMeasurementType,
    withoutDictionaryTranslations,
} from "@/core/helpers/variantDictionaries/localizeVariantDictionary"
import { IMeasurementTypeDependencies, IGetMeasurementTypeEvent } from "@/functions/PublicApi/types/measurementTypes"

export const getMeasurementTypeHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IGetMeasurementTypeEvent) => {
        const { id } = event.pathParameters;
        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        try {
            const measurementType = await measurementTypeRepository.getMeasurementType(id);
            if (!measurementType) throw new createError.NotFound("Measurement type not found")

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    measurementType: withoutDictionaryTranslations(
                        localizeMeasurementType(measurementType, locale),
                    ),
                },
            });
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Measurement type not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get measurement type");
        }
    }
}
