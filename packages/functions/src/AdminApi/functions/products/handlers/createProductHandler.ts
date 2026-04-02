import createError from "http-errors"
import slugify from "slugify"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateProductDependencies, ICreateProductEvent } from "@/functions/AdminApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"

export const createProductHandler = ({ productRepository, categoryRepository, assetRepository }: ICreateProductDependencies) => {
    return async (event: ICreateProductEvent) => {
        const { code, name, description, categoryId, attributeValueIds, assetType, assetRole, assetKey, mimeType } = event.body;

        try {
            const category = await categoryRepository.getCategory(categoryId)
            if (!category) throw new createError.NotFound("Category not found");

            if (Number(code.split(".")[0]) !== category.code) {
                throw new createError.BadRequest(`Product code must start with category code ${category.code}`);
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
                        connect: attributeValueIds.map((id: string) => ({ id }))
                    }
                    : undefined
            })

            // ✅ Asset kaydı: client S3'e upload ettiyse sadece DB kaydı oluştur
            if (assetType && assetKey && mimeType) {

                if (assetRole === "PRIMARY") {
                    await assetRepository.unsetProductPrimaryAssets(product.id)
                }
                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "GALLERY",
                    product: { connect: { id: product.id } },
                })

                product = await productRepository.getProduct(product.id) as typeof product;
            }

            return apiResponseDTO({
                statusCode: 201,
                payload: { product: mapProductWithAssets(product) },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new createError.Conflict("Product code already exists");
            throw new createError.InternalServerError("Failed to create product");
        }
    }
}
