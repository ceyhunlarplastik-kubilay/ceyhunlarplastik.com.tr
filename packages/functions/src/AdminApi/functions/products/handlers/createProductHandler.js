import createError, { HttpError } from "http-errors";
import slugify from "slugify";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets";
function isAttributeValueAllowedWithParents(allowedIds, value) {
    if (!value?.id)
        return false;
    if (allowedIds.has(value.id))
        return true;
    if (value.parentValueId && allowedIds.has(value.parentValueId))
        return true;
    if (value.parentValue?.id && allowedIds.has(value.parentValue.id))
        return true;
    if (value.parentValue?.parentValueId && allowedIds.has(value.parentValue.parentValueId))
        return true;
    if (value.parentValue?.parentValue?.id && allowedIds.has(value.parentValue.parentValue.id))
        return true;
    return false;
}
export const createProductHandler = ({ productRepository, categoryRepository, assetRepository, productAttributeValueRepository }) => {
    return async (event) => {
        const { code, name, description, categoryId, attributeValueIds, assetType, assetRole, assetKey, mimeType } = event.body;
        try {
            const category = await categoryRepository.getCategory(categoryId);
            if (!category)
                throw new createError.NotFound("Category not found");
            if (Number(code.split(".")[0]) !== category.code) {
                throw new createError.BadRequest(`Product code must start with category code ${category.code}`);
            }
            const allowedAttributeValueIds = category.allowedAttributeValueIds;
            if (attributeValueIds?.length && allowedAttributeValueIds && allowedAttributeValueIds.length > 0) {
                const allowedSet = new Set(allowedAttributeValueIds);
                const valueDetails = await Promise.all(attributeValueIds.map((valueId) => productAttributeValueRepository.getValueById(valueId)));
                const invalidAttributeValueIds = attributeValueIds.filter((valueId, index) => !isAttributeValueAllowedWithParents(allowedSet, valueDetails[index]));
                if (invalidAttributeValueIds.length > 0) {
                    throw new createError.BadRequest("Some selected attribute values are not allowed for this category");
                }
            }
            let product = await productRepository.createProduct({
                code,
                name,
                description,
                slug: slugify(name, { lower: true, strict: true, locale: "tr" }),
                category: { connect: { id: categoryId } },
                // 🔥 CORE LOGIC
                attributeValues: attributeValueIds?.length
                    ? {
                        connect: attributeValueIds.map((id) => ({ id }))
                    }
                    : undefined
            });
            // ✅ Asset kaydı: client S3'e upload ettiyse sadece DB kaydı oluştur
            if (assetType && assetKey && mimeType) {
                if (assetRole === "PRIMARY") {
                    await assetRepository.unsetProductPrimaryAssets(product.id);
                }
                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "GALLERY",
                    product: { connect: { id: product.id } },
                });
                product = await productRepository.getProduct(product.id);
            }
            return apiResponseDTO({
                statusCode: 201,
                payload: { product: mapProductWithAssets(product) },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002")
                    throw new createError.Conflict("Product code already exists");
                if (err.code === "P2025")
                    throw new createError.NotFound("Category not found");
            }
            throw new createError.InternalServerError("Failed to create product");
        }
    };
};
