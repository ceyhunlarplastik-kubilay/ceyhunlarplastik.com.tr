import createError, { HttpError } from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const createAssetHandler = ({ assetRepository, categoryRepository, productRepository, productVariantRepository, productAttributeValueRepository }) => {
    return async (event) => {
        const { key, url, mimeType, type, role, categoryId, productId, variantId, productAttributeValueId } = event.body;
        try {
            if (categoryId) {
                const category = await categoryRepository.getCategory(categoryId);
                if (!category)
                    throw new createError.NotFound("Category not found");
            }
            else if (productId) {
                const product = await productRepository.getProduct(productId);
                if (!product)
                    throw new createError.NotFound("Product not found");
            }
            else if (variantId) {
                const variant = await productVariantRepository.getProductVariant(variantId);
                if (!variant)
                    throw new createError.NotFound("ProductVariant not found");
            }
            else if (productAttributeValueId) {
                const value = await productAttributeValueRepository.getValueById(productAttributeValueId);
                if (!value)
                    throw new createError.NotFound("ProductAttributeValue not found");
            }
            const resolvedKey = key ?? url;
            if (!resolvedKey || !mimeType)
                throw new createError.BadRequest("key/url and mimeType are required");
            const asset = await assetRepository.createAsset({
                key: resolvedKey,
                mimeType,
                type,
                role: role ?? "GALLERY",
                ...(categoryId && { category: { connect: { id: categoryId } } }),
                ...(productId && { product: { connect: { id: productId } } }),
                ...(variantId && { variant: { connect: { id: variantId } } }),
                ...(productAttributeValueId && { productAttributeValueId }),
            });
            return apiResponseDTO({
                statusCode: 201,
                payload: { asset },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            console.error(err);
            throw new createError.InternalServerError("Failed to create asset");
        }
    };
};
