import createError, { HttpError } from "http-errors"
import slugify from "slugify"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateProductDependencies, ICreateProductEvent } from "@/functions/AdminApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import {
    assertAttributeValuesAllowedForCategory,
    assertNoIndustrialAttributeValues,
    buildProductIndustrialUsageCreateInputs,
    normalizeProductIndustrialUsages,
} from "@/core/helpers/products/productIndustrialUsages"
import {
    ProductTranslationInputError,
    buildProductTranslationCreateInputs,
    normalizeProductTranslations,
} from "@/core/helpers/products/productTranslations"
import { normalizeProductVideoUrls } from "@/core/helpers/products/productVideos"

// assetRepository artık gerekmiyor: asset kaydı ürün create'ine nested edildi.
export const createProductHandler = ({ productRepository, categoryRepository, productAttributeValueRepository }: ICreateProductDependencies) => {
    return async (event: ICreateProductEvent) => {
        const { code, name, description, categoryId, attributeValueIds, industrialUsages, translations, assemblyVideoUrl, promoVideoUrl, assetType, assetRole, assetKey, mimeType } = event.body;

        try {
            const category = await categoryRepository.getCategory(categoryId)
            if (!category) throw new createError.NotFound("Category not found");

            if (Number(code.split(".")[0]) !== category.code) {
                throw new createError.BadRequest(`Product code must start with category code ${category.code}`);
            }

            await assertNoIndustrialAttributeValues(productAttributeValueRepository, attributeValueIds)
            const normalizedIndustrialUsages = await normalizeProductIndustrialUsages(
                productAttributeValueRepository,
                industrialUsages,
            )
            const normalizedVideoUrls = normalizeProductVideoUrls({ assemblyVideoUrl, promoVideoUrl })

            await assertAttributeValuesAllowedForCategory(
                productAttributeValueRepository,
                attributeValueIds,
                (category as any).allowedAttributeValueIds as string[] | undefined,
            )

            const slug = slugify(name, { lower: true, strict: true, locale: "tr" })
            const normalizedTranslations = normalizeProductTranslations({
                legacyName: name,
                legacySlug: slug,
                legacyDescription: description ?? null,
                translations,
                requireTurkish: true,
            })

            const product = await productRepository.createProduct({
                code,
                name,
                description,
                slug,
                assemblyVideoUrl: normalizedVideoUrls.assemblyVideoUrl,
                promoVideoUrl: normalizedVideoUrls.promoVideoUrl,
                category: { connect: { id: categoryId } },
                translations: {
                    create: buildProductTranslationCreateInputs(normalizedTranslations.translations),
                },
                // 🔥 CORE LOGIC
                attributeValues: attributeValueIds?.length
                    ? {
                        connect: attributeValueIds.map((id: string) => ({ id }))
                    }
                    : undefined,
                industrialUsages: normalizedIndustrialUsages.length
                    ? {
                        create: buildProductIndustrialUsageCreateInputs(normalizedIndustrialUsages),
                    }
                    : undefined,
                // ✅ Asset kaydı: dosya client tarafından S3'e yüklendi, burada
                // yalnız DB kaydı açılıyor. Nested create sayesinde ürün dönüşü
                // asset'i zaten içeriyor; ayrı bir createAsset + yeniden okuma
                // (iki ekstra round-trip) gerekmiyor. `unsetProductPrimaryAssets`
                // de gerekmiyor: yeni ürünün önceki bir PRIMARY asset'i olamaz.
                assets: assetType && assetKey && mimeType
                    ? {
                        create: {
                            key: assetKey,
                            mimeType,
                            type: assetType,
                            role: assetRole ?? "GALLERY",
                        },
                    }
                    : undefined,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { product: mapProductWithAssets(product) },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof ProductTranslationInputError) throw new createError.BadRequest(err.message)
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    const targets = (err.meta?.target as string[] | undefined) ?? [];
                    if (targets.includes("code")) throw new createError.Conflict("Product code already exists");
                    if (targets.includes("slug")) throw new createError.Conflict("Product slug already exists");
                    throw new createError.Conflict("Unique constraint failed");
                }
                if (err.code === "P2025") throw new createError.NotFound("Category not found");
            }
            throw new createError.InternalServerError("Failed to create product");
        }
    }
}
