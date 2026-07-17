import { Prisma } from "@/prisma/generated/prisma/client"
import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IUpdateCategoryDependencies, IUpdateCategoryEvent } from "@/functions/AdminApi/types/categories"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"
import { assertNoIndustrialAttributeValues } from "@/core/helpers/products/productIndustrialUsages"
import {
    CategoryTranslationInputError,
    normalizeCategoryTranslations,
} from "@/core/helpers/categories/categoryTranslations"
import { DEFAULT_LOCALE } from "@/core/i18n/locales"

export const updateCategoryHandler = ({
    categoryRepository,
    assetRepository,
    productAttributeValueRepository,
}: IUpdateCategoryDependencies) => {
    return async (event: IUpdateCategoryEvent) => {
        const id = event.pathParameters?.id
        const body = event.body

        if (!id) throw new createError.BadRequest("Category ID is required")
        if (!body || Object.keys(body).length === 0)
            throw new createError.BadRequest("At least one field must be provided")

        const allowedFields = ["name", "translations", "removeTranslationLocales", "allowedAttributeValueIds", "assetType", "assetRole", "assetKey", "mimeType"] as const

        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0)
            throw new createError.BadRequest(
                `Invalid fields provided: ${invalidFields.join(", ")}`
            )

        const { name, translations, removeTranslationLocales, allowedAttributeValueIds, assetType, assetRole, assetKey, mimeType } = body

        const removableLocales = new Set<string>(removeTranslationLocales ?? [])
        const conflictingLocales = translations
            ?.map((translation) => translation.locale)
            .filter((locale) => removableLocales.has(locale)) ?? []

        if (conflictingLocales.length > 0) {
            throw new createError.BadRequest(
                `Cannot update and remove the same translation locale: ${conflictingLocales.join(", ")}`
            )
        }

        if (allowedAttributeValueIds !== undefined) {
            await assertNoIndustrialAttributeValues(productAttributeValueRepository, allowedAttributeValueIds)
        }

        try {
            const normalized = normalizeCategoryTranslations({
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
                                categoryId_locale: {
                                    categoryId: id,
                                    locale: translation.locale,
                                },
                            },
                            create: translation,
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
                            locale: { in: removeTranslationLocales },
                        },
                    }),
                }
                : undefined
            const updateData: Prisma.CategoryUpdateInput = {
                ...(normalized.turkish && {
                    name: normalized.turkish.name,
                    slug: normalized.turkish.slug,
                }),
                ...(translationWrites && {
                    translations: translationWrites,
                }),
                ...(allowedAttributeValueIds !== undefined && {
                    allowedAttributeValueIds,
                }),
            }

            // 1️⃣ Category update
            let category = await categoryRepository.updateCategory(id, updateData)

            // 2️⃣ Yeni asset geldiyse lifecycle yönetimi
            if (assetType && assetKey && mimeType) {

                if (assetRole === "PRIMARY") {
                    await assetRepository.unsetCategoryPrimaryAssets(id)
                }

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "GALLERY",
                    category: { connect: { id } },
                })

                category = await categoryRepository.getCategory(id) as typeof category
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: { category: mapCategoryWithAssets(category) },
            })

        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof CategoryTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }

            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025")
                    throw new createError.NotFound("Category not found")
                if (err.code === "P2002")
                    throw new createError.Conflict("Duplicate slug or code")
            }

            console.error(err)
            throw new createError.InternalServerError(
                "Failed to update category"
            )
        }
    }
}
