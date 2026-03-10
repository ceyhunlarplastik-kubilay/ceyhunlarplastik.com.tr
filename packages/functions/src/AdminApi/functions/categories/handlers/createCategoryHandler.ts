import createError, { HttpError } from "http-errors"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateCategoryDependencies, ICreateCategoryEvent } from "@/functions/AdminApi/types/categories"
import { Prisma } from "@/prisma/generated/prisma/client"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"

export const createCategoryHandler = ({ categoryRepository, assetRepository }: ICreateCategoryDependencies) => {
    return async (event: ICreateCategoryEvent) => {
        const body = event.body

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least  one field must be provided");

        const allowedFields = ["code", "name", "assetType", "assetRole", "assetKey", "mimeType"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { code, name, assetType, assetRole, assetKey, mimeType } = body
        const slug = slugify(name, { lower: true, strict: true, locale: "tr" })
        try {
            let category = await categoryRepository.createCategory({
                code,
                name,
                slug
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
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") throw new createError.Conflict(`Category with the code ${code} already exists`)
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create a category");
        }
    }
}
