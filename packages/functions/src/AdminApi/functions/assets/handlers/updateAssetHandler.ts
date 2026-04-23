import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IAssetDependencies, IUpdateAssetEvent } from "@/functions/AdminApi/types/assets"

export const updateAssetHandler = ({ assetRepository, categoryRepository, productRepository, productVariantRepository, productAttributeValueRepository }: IAssetDependencies) => {
    return async (event: IUpdateAssetEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await assetRepository.getAsset(id);
            if (!existing) throw new createError.NotFound("Asset not found");

            if (body.categoryId) {
                const category = await categoryRepository.getCategory(body.categoryId);
                if (!category) throw new createError.NotFound("Category not found");
            }
            if (body.productId) {
                const product = await productRepository.getProduct(body.productId);
                if (!product) throw new createError.NotFound("Product not found");
            }
            if (body.variantId) {
                const variant = await productVariantRepository.getProductVariant(body.variantId);
                if (!variant) throw new createError.NotFound("ProductVariant not found");
            }
            if (body.productAttributeValueId) {
                const value = await productAttributeValueRepository.getValueById(body.productAttributeValueId);
                if (!value) throw new createError.NotFound("ProductAttributeValue not found");
            }

            const { url, key, categoryId, productId, variantId, productAttributeValueId, ...rest } = body
            const updated = await assetRepository.updateAsset(id, {
                ...rest,
                ...(url || key ? { key: key ?? url } : {}),
                ...(categoryId && { category: { connect: { id: categoryId } } }),
                ...(productId && { product: { connect: { id: productId } } }),
                ...(variantId && { variant: { connect: { id: variantId } } }),
                ...(productAttributeValueId && { productAttributeValueId }),
            } as any);

            return apiResponseDTO({
                statusCode: 200,
                payload: { asset: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err);
            throw new createError.InternalServerError("Failed to update asset");
        }
    }
}
