import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IAssetDependencies, ICreateAssetEvent } from "@/functions/AdminApi/types/assets"

export const createAssetHandler = ({ assetRepository, categoryRepository, productRepository, productVariantRepository, productAttributeValueRepository, materialRepository }: IAssetDependencies) => {
    return async (event: ICreateAssetEvent) => {
        const { key, url, mimeType, type, role, categoryId, productId, variantId, productAttributeValueId, materialId } = event.body;

        try {
            if (categoryId) {
                const category = await categoryRepository.getCategory(categoryId)
                if (!category) throw new createError.NotFound("Category not found");
            } else if (productId) {
                const product = await productRepository.getProduct(productId)
                if (!product) throw new createError.NotFound("Product not found");
            } else if (variantId) {
                const variant = await productVariantRepository.getProductVariant(variantId)
                if (!variant) throw new createError.NotFound("ProductVariant not found");
            } else if (productAttributeValueId) {
                const value = await productAttributeValueRepository.getValueById(productAttributeValueId)
                if (!value) throw new createError.NotFound("ProductAttributeValue not found");
            } else if (materialId) {
                const material = await materialRepository.getMaterial(materialId)
                if (!material) throw new createError.NotFound("Material not found");
            }

            const resolvedKey = key ?? url
            if (!resolvedKey || !mimeType) throw new createError.BadRequest("key/url and mimeType are required")

            const asset = await assetRepository.createAsset({
                key: resolvedKey,
                mimeType,
                type,
                role: role ?? "GALLERY",
                ...(categoryId && { category: { connect: { id: categoryId } } }),
                ...(productId && { product: { connect: { id: productId } } }),
                ...(variantId && { variant: { connect: { id: variantId } } }),
                ...(productAttributeValueId && { productAttributeValueId }),
                ...(materialId && { material: { connect: { id: materialId } } }),
            } as any)

            return apiResponseDTO({
                statusCode: 201,
                payload: { asset },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            console.error(err);
            throw new createError.InternalServerError("Failed to create asset");
        }
    }
}
