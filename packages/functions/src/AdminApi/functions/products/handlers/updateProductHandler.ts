/* import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateProductDependencies, IUpdateProductEvent } from "@/functions/AdminApi/types/products"

export const updateProductHandler = ({ productRepository, categoryRepository, assetRepository }: ICreateProductDependencies) => {
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

            let updated = await productRepository.updateProduct(id, {
                ...body,
                ...(body.categoryId && { category: { connect: { id: body.categoryId } } }),
                ...(body.name && { slug: slugify(body.name, { lower: true, strict: true, locale: "tr" }) }),
            });

            const { assetType, assetRole, assetKey, mimeType } = body;

            if (assetType && assetKey && mimeType) {

                if (assetRole === "PRIMARY") {
                    await assetRepository.unsetProductPrimaryAssets(id)
                }

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "GALLERY",
                    product: { connect: { id } },
                })

                updated = await productRepository.getProduct(id) as typeof updated;
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: updated },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                const targets = (err.meta?.target as string[] | undefined) ?? [];
                if (targets.includes("code")) throw new createError.Conflict("Product code already exists");
                if (targets.includes("slug")) throw new createError.Conflict("Product slug already exists");
                throw new createError.Conflict("Unique constraint failed");
            }
            throw new createError.InternalServerError("Failed to update product");
        }
    }
}
 */


import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateProductDependencies, IUpdateProductEvent } from "@/functions/AdminApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"

export const updateProductHandler = ({ productRepository, categoryRepository, assetRepository }: ICreateProductDependencies) => {
    return async (event: IUpdateProductEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;

        // 🔥 asset alanlarını ayır
        const { assetType, assetRole, assetKey, mimeType, attributeValueIds, categoryId, ...productData } = body;

        try {

            const existing = await productRepository.getProduct(id);
            if (!existing) throw new createError.NotFound("Product not found");

            // Validation: Ensure product code starts with category code
            if (productData.code || categoryId) {

                const targetCode = productData.code || existing.code;
                let targetCategoryCode: number;

                if (categoryId) {

                    const category = await categoryRepository.getCategory(categoryId);
                    if (!category) throw new createError.NotFound("Category not found");

                    targetCategoryCode = category.code;

                } else {

                    if (!existing.category) {

                        const category = await categoryRepository.getCategory(existing.categoryId);
                        if (!category) throw new createError.NotFound("Existing Category not found");

                        targetCategoryCode = category.code;

                    } else {

                        targetCategoryCode = existing.category.code;

                    }
                }

                if (Number(targetCode.split(".")[0]) !== targetCategoryCode) {
                    throw new createError.BadRequest(
                        `Product code must start with category code ${targetCategoryCode}`
                    );
                }
            }

            // 🔧 product update (asset alanları burada YOK)
            let updated = await productRepository.updateProduct(id, {

                ...productData,

                ...(categoryId && {
                    category: { connect: { id: categoryId } }
                }),

                ...(productData.name && {
                    slug: slugify(productData.name, {
                        lower: true,
                        strict: true,
                        locale: "tr"
                    })
                }),

                ...(attributeValueIds !== undefined && {
                    attributeValues: {
                        set: attributeValueIds.map((id: string) => ({ id }))
                    }
                })
            })

            // 🔥 asset lifecycle
            if (assetType && assetKey && mimeType) {

                if (assetRole === "PRIMARY") {
                    await assetRepository.unsetProductPrimaryAssets(id)
                }

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "GALLERY",
                    product: { connect: { id } },
                })

                updated = await productRepository.getProduct(id) as typeof updated;
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: mapProductWithAssets(updated) },
            })

        } catch (err: any) {

            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                const targets = (err.meta?.target as string[] | undefined) ?? [];
                if (targets.includes("code")) throw new createError.Conflict("Product code already exists");
                if (targets.includes("slug")) throw new createError.Conflict("Product slug already exists");
                throw new createError.Conflict("Unique constraint failed");
            }
            throw new createError.InternalServerError("Failed to update product");
        }
    }
}
