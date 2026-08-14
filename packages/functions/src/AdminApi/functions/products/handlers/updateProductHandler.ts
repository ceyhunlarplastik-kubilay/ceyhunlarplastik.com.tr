import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateProductDependencies, IUpdateProductEvent } from "@/functions/AdminApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import {
    assertAttributeValuesAllowedForCategory,
    assertNoIndustrialAttributeValues,
    buildProductIndustrialUsageCreateInputs,
    buildProductIndustrialUsageUpdateInput,
    normalizeProductIndustrialUsages,
} from "@/core/helpers/products/productIndustrialUsages"
import {
    ProductTranslationInputError,
    buildProductTranslationUpserts,
    normalizeProductTranslations,
} from "@/core/helpers/products/productTranslations"
import { normalizeProductVideoUrls } from "@/core/helpers/products/productVideos"

// assetRepository artık gerekmiyor: asset lifecycle ürün update'ine nested edildi.
export const updateProductHandler = ({ productRepository, categoryRepository, productAttributeValueRepository }: ICreateProductDependencies) => {
    return async (event: IUpdateProductEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;

        // 🔥 asset alanlarını ayır
        // Video URL'leri de ayrılır: ham hâlleriyle productData üzerinden Prisma'ya
        // sızmamalı, normalizeProductVideoUrls'ten geçmeleri gerekir.
        const { assetType, assetRole, assetKey, mimeType, model3dConfig, attributeValueIds, industrialUsages, translations, categoryId, assemblyVideoUrl, promoVideoUrl, ...productData } = body;

        try {

            // Slim okuma: bu handler yalnız birkaç skalar alan, kategorinin code +
            // allowedAttributeValueIds'i ve mevcut usage ID'lerini kullanıyor.
            const existing = await productRepository.getProductForUpdate(id);
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

            const targetCategory =
                categoryId
                    ? await categoryRepository.getCategory(categoryId)
                    : (existing.category as any)

            if (!targetCategory) throw new createError.NotFound("Category not found")

            const descriptionWasProvided = Object.prototype.hasOwnProperty.call(productData, "description")
            const nextName = productData.name ?? existing.name
            const nextSlug = productData.name
                ? slugify(productData.name, {
                    lower: true,
                    strict: true,
                    locale: "tr",
                })
                : existing.slug
            const nextDescription = descriptionWasProvided
                ? productData.description ?? null
                : existing.description ?? null

            // Çeviriler yalnızca çeviriyi ETKİLEYEN bir alan geldiğinde yazılır.
            // Eskiden koşulsuzdu: sadece assemblyVideoUrl gönderen bir istek bile
            // TR/EN ProductTranslation satırlarını boşuna upsert ediyordu.
            const shouldWriteTranslations =
                translations !== undefined ||
                productData.name !== undefined ||
                descriptionWasProvided
            const normalizedProductTranslations = shouldWriteTranslations
                ? normalizeProductTranslations({
                    legacyName: nextName,
                    legacySlug: nextSlug,
                    legacyDescription: nextDescription,
                    translations,
                    requireTurkish: true,
                })
                : undefined

            await assertNoIndustrialAttributeValues(productAttributeValueRepository, attributeValueIds)
            const normalizedIndustrialUsages = industrialUsages !== undefined
                ? await normalizeProductIndustrialUsages(productAttributeValueRepository, industrialUsages)
                : undefined
            const existingIndustrialUsageIds = new Set(
                (existing.industrialUsages ?? []).map((usage) => usage.id),
            )
            const retainedIndustrialUsageIds = normalizedIndustrialUsages
                ?.flatMap((usage) => usage.id ? [usage.id] : []) ?? []

            const invalidIndustrialUsageIds = retainedIndustrialUsageIds.filter(
                (usageId) => !existingIndustrialUsageIds.has(usageId),
            )
            if (invalidIndustrialUsageIds.length > 0) {
                throw new createError.BadRequest("Some industrial usage rows do not belong to this product")
            }

            // Gönderilmeyen alan `undefined` kalır → Prisma o kolona dokunmaz.
            const normalizedVideoUrls = normalizeProductVideoUrls({ assemblyVideoUrl, promoVideoUrl })

            await assertAttributeValuesAllowedForCategory(
                productAttributeValueRepository,
                attributeValueIds,
                (targetCategory as any).allowedAttributeValueIds as string[] | undefined,
            )

            const updated = await productRepository.updateProduct(id, {

                ...productData,

                assemblyVideoUrl: normalizedVideoUrls.assemblyVideoUrl,
                promoVideoUrl: normalizedVideoUrls.promoVideoUrl,

                ...(categoryId && {
                    category: { connect: { id: categoryId } }
                }),

                ...(productData.name && {
                    slug: nextSlug,
                }),

                ...(normalizedProductTranslations && {
                    translations: {
                        upsert: buildProductTranslationUpserts(
                            id,
                            normalizedProductTranslations.translations,
                        ),
                    },
                }),

                ...(attributeValueIds !== undefined && {
                    attributeValues: {
                        set: attributeValueIds.map((id: string) => ({ id }))
                    }
                }),

                ...(normalizedIndustrialUsages !== undefined && {
                    industrialUsages: {
                        deleteMany: retainedIndustrialUsageIds.length > 0
                            ? { id: { notIn: retainedIndustrialUsageIds } }
                            : {},
                        ...(normalizedIndustrialUsages.some((usage) => usage.id) && {
                            update: normalizedIndustrialUsages
                                .filter((usage) => usage.id)
                                .map((usage) => ({
                                    where: { id: usage.id! },
                                    data: buildProductIndustrialUsageUpdateInput(usage),
                                })),
                        }),
                        ...(normalizedIndustrialUsages.some((usage) => !usage.id) && {
                            create: buildProductIndustrialUsageCreateInputs(
                                normalizedIndustrialUsages.filter((usage) => !usage.id),
                            ),
                        }),
                    },
                }),

                // Asset lifecycle: dosya client tarafından S3'e yüklendi, burada
                // yalnız DB kaydı açılıyor. Eskiden update'ten SONRA iki ayrı
                // yazma (unsetProductPrimaryAssets + createAsset) ve ardından
                // ürünü baştan okuyan üçüncü bir ağır sorgu vardı. Nested hâli
                // aynı etkiyi tek transaction'da veriyor ve dönüş asset'i zaten
                // içerdiği için yeniden okuma gerekmiyor.
                ...(assetType && assetKey && mimeType && {
                    assets: {
                        // Yeni PRIMARY geliyorsa mevcut PRIMARY'ler GALLERY'ye düşer.
                        ...(assetRole === "PRIMARY" && {
                            updateMany: {
                                where: { role: "PRIMARY" as const },
                                data: { role: "GALLERY" as const },
                            },
                        }),
                        create: {
                            key: assetKey,
                            mimeType,
                            type: assetType,
                            role: assetRole ?? "GALLERY",
                            ...(model3dConfig && {
                                model3dConfig: model3dConfig as Prisma.InputJsonValue,
                            }),
                        },
                    },
                }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: mapProductWithAssets(updated) },
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
                if (err.code === "P2025") throw new createError.NotFound("Product or category not found");
            }
            throw new createError.InternalServerError("Failed to update product");
        }
    }
}
