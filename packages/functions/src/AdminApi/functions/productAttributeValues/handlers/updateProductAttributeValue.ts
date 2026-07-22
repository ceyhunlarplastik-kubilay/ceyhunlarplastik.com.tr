import createError, { HttpError } from "http-errors"
import { deleteS3Objects } from "@/core/helpers/s3/deleteObjects"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IUpdateProductAttributeValueEvent } from "@/functions/AdminApi/types/productAttributeValues"
import {
    ProductAttributeTranslationInputError,
    normalizeProductAttributeValueTranslations,
} from "@/core/helpers/productAttributes/productAttributeTranslations"
import { DEFAULT_LOCALE } from "@/core/i18n/locales"

const ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const updateProductAttributeValueHandler = ({
    productAttributeValueRepository,
    assetRepository,
}: IProductAttributeValueDependencies) => {
    return async (event: IUpdateProductAttributeValueEvent) => {
        const { id } = event.pathParameters
        const body = event.body

        try {
            const current = await productAttributeValueRepository.getValueById(id)
            if (!current) throw new createError.NotFound("Value not found")

            const {
                name,
                translations,
                removeTranslationLocales,
                displayOrder,
            } = body
            const removableLocales = new Set<string>(removeTranslationLocales ?? [])
            const conflictingLocales = translations
                ?.map((translation) => translation.locale)
                .filter((locale) => removableLocales.has(locale)) ?? []

            if (conflictingLocales.length > 0) {
                throw new createError.BadRequest(
                    `Cannot update and remove the same translation locale: ${conflictingLocales.join(", ")}`
                )
            }

            const hasParentValueInput = Object.prototype.hasOwnProperty.call(body, "parentValueId")
            const requestedParentValueId = body.parentValueId

            if (hasParentValueInput) {
                if (requestedParentValueId) {
                    const parentValue = await productAttributeValueRepository.getValueById(requestedParentValueId)
                    if (!parentValue) throw new createError.NotFound("Parent value not found")

                    if (current.attribute.code === ATTRIBUTE_CODES.productionGroup && parentValue.attribute.code !== ATTRIBUTE_CODES.sector) {
                        throw new createError.BadRequest("production_group values must be linked to a sector value")
                    }

                    if (current.attribute.code === ATTRIBUTE_CODES.usageArea && parentValue.attribute.code !== ATTRIBUTE_CODES.productionGroup) {
                        throw new createError.BadRequest("usage_area values must be linked to a production_group value")
                    }

                    if (
                        current.attribute.code !== ATTRIBUTE_CODES.productionGroup &&
                        current.attribute.code !== ATTRIBUTE_CODES.usageArea
                    ) {
                        throw new createError.BadRequest("parentValueId is only supported for production_group and usage_area")
                    }
                } else if (
                    requestedParentValueId === null &&
                    (current.attribute.code === ATTRIBUTE_CODES.productionGroup || current.attribute.code === ATTRIBUTE_CODES.usageArea)
                ) {
                    throw new createError.BadRequest(`${current.attribute.code} value requires parentValueId`)
                }
            }

            const normalized = normalizeProductAttributeValueTranslations({
                legacyName: name,
                translations,
            })
            const explicitSlugLocales = new Set(
                translations
                    ?.filter((translation) => translation.slug?.trim())
                    .map((translation) => translation.locale) ?? [],
            )
            const translationWrites = normalized.translations.length > 0 || removeTranslationLocales?.length
                ? {
                    ...(normalized.translations.length > 0 && {
                        upsert: normalized.translations.map((translation) => ({
                            where: {
                                productAttributeValueId_locale: {
                                    productAttributeValueId: id,
                                    locale: translation.locale,
                                },
                            },
                            create: {
                                ...translation,
                                attribute: {
                                    connect: { id: current.attributeId },
                                },
                            },
                            update: {
                                name: translation.name,
                                ...(translation.locale === DEFAULT_LOCALE || explicitSlugLocales.has(translation.locale)
                                    ? { slug: translation.slug }
                                    : {}),
                            },
                        })),
                    }),
                    ...(removeTranslationLocales?.length && {
                        deleteMany: {
                            locale: {
                                in: removeTranslationLocales.filter((locale) => locale !== DEFAULT_LOCALE),
                            },
                        },
                    }),
                }
                : undefined

            const value = await productAttributeValueRepository.updateValue(id, {
                ...(normalized.turkish && {
                    name: normalized.turkish.name,
                    slug: normalized.turkish.slug,
                }),
                ...(displayOrder !== undefined && {
                    displayOrder,
                }),
                ...(translationWrites && {
                    translations: translationWrites,
                }),
                ...(hasParentValueInput && {
                    parentValue: requestedParentValueId
                        ? { connect: { id: requestedParentValueId } }
                        : { disconnect: true }
                }),
            })

            const { assetType, assetRole, assetKey, mimeType } = body
            if (assetType && assetKey && mimeType) {
                if ((assetRole ?? "PRIMARY") === "PRIMARY") {
                    const existingPrimaryAssets = current.assets.filter((asset: { role: string }) => asset.role === "PRIMARY")

                    if (existingPrimaryAssets.length > 0) {
                        try {
                            await deleteS3Objects(existingPrimaryAssets.map((asset: { key: string }) => asset.key))
                        } catch (error) {
                            console.error("Product attribute value primary asset cleanup failed:", error)
                            throw new createError.InternalServerError("Görsel silinemedi, işlem tamamlanmadı")
                        }

                        await assetRepository.deleteAssetsByIds(existingPrimaryAssets.map((asset: { id: string }) => asset.id))
                    }
                }

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "PRIMARY",
                    productAttributeValueId: id,
                } as any)
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: { value }
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            if (error instanceof ProductAttributeTranslationInputError) {
                throw new createError.BadRequest(error.message)
            }
            console.error(error);
            throw new createError.InternalServerError("Failed to update value");
        }
    }
}
