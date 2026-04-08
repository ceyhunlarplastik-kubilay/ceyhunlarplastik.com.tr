import { Prisma } from "@/prisma/generated/prisma/client"
import slugify from "slugify"
import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IUpdateCategoryDependencies, IUpdateCategoryEvent } from "@/functions/AdminApi/types/categories"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"

export const updateCategoryHandler = ({
    categoryRepository,
    assetRepository,
}: IUpdateCategoryDependencies) => {
    return async (event: IUpdateCategoryEvent) => {
        const id = event.pathParameters?.id
        const body = event.body

        if (!id) throw new createError.BadRequest("Category ID is required")
        if (!body || Object.keys(body).length === 0)
            throw new createError.BadRequest("At least one field must be provided")

        const allowedFields = ["name", "allowedAttributeValueIds", "assetType", "assetRole", "assetKey", "mimeType"] as const

        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0)
            throw new createError.BadRequest(
                `Invalid fields provided: ${invalidFields.join(", ")}`
            )

        const { name, allowedAttributeValueIds, assetType, assetRole, assetKey, mimeType } = body

        const updateData: Prisma.CategoryUpdateInput = {
            ...(name !== undefined && {
                name,
                slug: slugify(name, { lower: true, strict: true, locale: "tr" }),
            }),
            ...(allowedAttributeValueIds !== undefined && {
                allowedAttributeValueIds,
            }),
        }

        try {
            // 1️⃣ Category update
            let category = await categoryRepository.updateCategory(id, updateData as any)

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
