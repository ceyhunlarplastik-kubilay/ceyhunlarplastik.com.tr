import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapMaterialWithAssets } from "@/core/helpers/assets/mapMaterialWithAssets"
import { IMaterialDependencies, ICreateMaterialEvent } from "@/functions/AdminApi/types/materials"
import {
    normalizeVariantDictionaryTranslations,
    VariantDictionaryTranslationInputError,
} from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

export const createMaterialHandler = ({ materialRepository }: Pick<IMaterialDependencies, "materialRepository">) => {
    return async (event: ICreateMaterialEvent) => {
        const { name, code, translations } = event.body;

        try {
            const normalized = normalizeVariantDictionaryTranslations({
                legacyName: name,
                translations,
                requireTurkish: true,
            })
            const turkish = normalized.turkish!
            const material = await materialRepository.createMaterial({
                name: turkish.name,
                code,
                translations: {
                    create: normalized.translations,
                },
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { material: mapMaterialWithAssets(material) },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof VariantDictionaryTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Material name already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create material");
        }
    }
}
