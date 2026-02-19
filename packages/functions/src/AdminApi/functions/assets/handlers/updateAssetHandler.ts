import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IAssetDependencies, IUpdateAssetEvent } from "@/functions/AdminApi/types/assets"

export const updateAssetHandler = ({ assetRepository, categoryRepository, productRepository, productVariantRepository }: IAssetDependencies) => {
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

            const updated = await assetRepository.updateAsset(id, {
                ...body,
                ...(body.categoryId && { category: { connect: { id: body.categoryId } } }),
                ...(body.productId && { product: { connect: { id: body.productId } } }),
                ...(body.variantId && { variant: { connect: { id: body.variantId } } }),
            });

            return apiResponseDTO({
                statusCode: 200,
                payload: { asset: updated },
            })
        } catch (err: any) {
            console.error(err);
            throw new createError.InternalServerError("Failed to update asset");
        }
    }
}
