import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateCategoryDependencies, ICreateCategoryEvent } from "@/functions/AdminApi/types/categories"
import { Prisma } from "@/prisma/generated/prisma/client"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"
import { assertNoIndustrialAttributeValues } from "@/core/helpers/products/productIndustrialUsages"
import {
    CategoryTranslationInputError,
    normalizeCategoryTranslations,
} from "@/core/helpers/categories/categoryTranslations"

export const createCategoryHandler = ({ categoryRepository, assetRepository, productAttributeValueRepository }: ICreateCategoryDependencies) => {
    return async (event: ICreateCategoryEvent) => {
        const body = event.body

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least  one field must be provided");

        const allowedFields = ["code", "name", "translations", "allowedAttributeValueIds", "assetType", "assetRole", "assetKey", "mimeType"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { code, name, translations, allowedAttributeValueIds, assetType, assetRole, assetKey, mimeType } = body
        try {
            const normalized = normalizeCategoryTranslations({
                legacyName: name,
                translations,
                requireTurkish: true,
            })
            const turkish = normalized.turkish!

            await assertNoIndustrialAttributeValues(productAttributeValueRepository, allowedAttributeValueIds)

            let category = await categoryRepository.createCategory({
                code,
                name: turkish.name,
                slug: turkish.slug,
                ...(allowedAttributeValueIds && { allowedAttributeValueIds }),
                translations: {
                    create: normalized.translations,
                },
            })

            // ✅ Asset kaydı: client S3'e upload ettiyse sadece DB kaydı oluştur
            if (assetType && assetKey && mimeType) {

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "PRIMARY",
                    category: { connect: { id: category.id } },
                })

                category = await categoryRepository.getCategory(category.id) as typeof category
            }

            return apiResponseDTO({
                statusCode: 201,
                payload: { category: mapCategoryWithAssets(category) },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof CategoryTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    throw new createError.Conflict("Category code or localized slug already exists")
                }
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create a category");
        }
    }
}
