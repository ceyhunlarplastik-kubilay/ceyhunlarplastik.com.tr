import createError, { HttpError } from "http-errors";
import slugify from "slugify";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { Prisma } from "@/prisma/generated/prisma/client";
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets";
export const createCategoryHandler = ({ categoryRepository, assetRepository }) => {
    return async (event) => {
        const body = event.body;
        if (!body || Object.keys(body).length === 0)
            throw new createError.BadRequest("At least  one field must be provided");
        const allowedFields = ["code", "name", "allowedAttributeValueIds", "assetType", "assetRole", "assetKey", "mimeType"];
        const invalidFields = Object.keys(body).filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0)
            throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`);
        const { code, name, allowedAttributeValueIds, assetType, assetRole, assetKey, mimeType } = body;
        const slug = slugify(name, { lower: true, strict: true, locale: "tr" });
        try {
            let category = await categoryRepository.createCategory({
                code,
                name,
                slug,
                ...(allowedAttributeValueIds && { allowedAttributeValueIds }),
            });
            // ✅ Asset kaydı: client S3'e upload ettiyse sadece DB kaydı oluştur
            if (assetType && assetKey && mimeType) {
                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "PRIMARY",
                    category: { connect: { id: category.id } },
                });
                category = await categoryRepository.getCategory(category.id);
            }
            return apiResponseDTO({
                statusCode: 201,
                payload: { category: mapCategoryWithAssets(category) },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002")
                    throw new createError.Conflict(`Category with the code ${code} already exists`);
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create a category");
        }
    };
};
