import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductDependencies, IUpdateProductEvent } from "@/functions/AdminApi/types/products"

export const updateProductHandler = ({ productRepository, categoryRepository }: IProductDependencies) => {
    return async (event: IUpdateProductEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await productRepository.getProduct(id);
            if (!existing) throw new createError.NotFound("Product not found");

            // Validation: Ensure product code starts with category code
            if (body.code || body.categoryId) {
                const targetCode = body.code || existing.code;
                let targetCategoryCode: number;

                if (body.categoryId) {
                    const category = await categoryRepository.getCategory(body.categoryId);
                    if (!category) throw new createError.NotFound("Category not found");
                    targetCategoryCode = category.code;
                } else {
                    // Fetch existing category if not updating categoryId
                    // Note: We need to ensure existing product has category loaded or fetch it.
                    // The repository getProduct includes category, so existing.category should be available.
                    if (!existing.category) {
                        // Should theoretically not happen if getProduct includes category
                        const category = await categoryRepository.getCategory(existing.categoryId);
                        if (!category) throw new createError.NotFound("Existing Category not found");
                        targetCategoryCode = category.code;
                    } else {
                        targetCategoryCode = existing.category.code;
                    }
                }

                if (Number(targetCode.split(".")[0]) !== targetCategoryCode) {
                    throw new createError.BadRequest(`Product code must start with category code ${targetCategoryCode}`);
                }
            }

            if (body.categoryId && !body.code) { // Optimization: If only category changed, we already checked.
                // logic falls through to update
            }

            const updated = await productRepository.updateProduct(id, {
                ...body,
                ...(body.categoryId && { category: { connect: { id: body.categoryId } } }),
            });

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: updated },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new createError.Conflict("Product code already exists");
            throw new createError.InternalServerError("Failed to update product");
        }
    }
}
