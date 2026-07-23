import createError, { HttpError } from "http-errors"
import { AssetRole, AssetType, Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapMaterialWithAssets } from "@/core/helpers/assets/mapMaterialWithAssets"
import { IMaterialDependencies, IUpdateMaterialEvent } from "@/functions/AdminApi/types/materials"
import { DEFAULT_LOCALE } from "@/core/i18n/locales"
import {
    normalizeVariantDictionaryTranslations,
    VariantDictionaryTranslationInputError,
} from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

export const updateMaterialHandler = ({ materialRepository, assetRepository }: IMaterialDependencies) => {
    return async (event: IUpdateMaterialEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await materialRepository.getMaterial(id);
            if (!existing) throw new createError.NotFound("Material not found");

            const {
                name,
                code,
                translations,
                assetKey,
                assetType,
                assetRole,
                mimeType,
            } = body
            const normalized = normalizeVariantDictionaryTranslations({
                legacyName: name,
                translations,
            })
            const translationWrites: Prisma.MaterialUpdateInput["translations"] =
                normalized.turkish || normalized.createOnlyTranslations.length > 0
                    ? {
                        ...(normalized.turkish && {
                            upsert: {
                                where: {
                                    materialId_locale: {
                                        materialId: id,
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
                                    materialId_locale: {
                                        materialId: id,
                                        locale: translation.locale,
                                    },
                                },
                                create: translation,
                            })),
                        }),
                    }
                    : undefined

            const updated = await materialRepository.updateMaterial(id, {
                ...(normalized.turkish && { name: normalized.turkish.name }),
                ...(code !== undefined && { code }),
                ...(translationWrites && { translations: translationWrites }),
            });

            if (assetKey || assetType || assetRole || mimeType) {
                if (!assetKey || !assetType || !assetRole || !mimeType) {
                    throw new createError.BadRequest("assetKey, assetType, assetRole and mimeType are required together")
                }

                if (
                    assetType !== AssetType.PDF ||
                    assetRole !== AssetRole.CERTIFICATE ||
                    mimeType !== "application/pdf"
                ) {
                    throw new createError.BadRequest("Only PDF certificate assets are supported for materials")
                }

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole,
                    material: { connect: { id } },
                })
            }

            const material = await materialRepository.getMaterial(id) ?? updated

            return apiResponseDTO({
                statusCode: 200,
                payload: { material: mapMaterialWithAssets(material) },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof VariantDictionaryTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Material name already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update material");
        }
    }
}
