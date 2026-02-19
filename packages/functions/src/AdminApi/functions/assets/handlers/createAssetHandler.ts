import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IAssetDependencies, ICreateAssetEvent } from "@/functions/AdminApi/types/assets"

export const createAssetHandler = ({ assetRepository, categoryRepository, productRepository, productVariantRepository }: IAssetDependencies) => {
    return async (event: ICreateAssetEvent) => {
        const { url, type, categoryId, productId, variantId } = event.body;

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
            }

            const asset = await assetRepository.createAsset({
                url,
                type,
                ...(categoryId && { category: { connect: { id: categoryId } } }),
                ...(productId && { product: { connect: { id: productId } } }),
                ...(variantId && { variant: { connect: { id: variantId } } }),
            })

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
