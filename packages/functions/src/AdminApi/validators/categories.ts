import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { localeSchema, targetLocaleSchema, REMOVABLE_TRANSLATION_LOCALES_MAX, TRANSLATIONS_ARRAY_MAX } from "@/core/helpers/validation/localeSchema"
import { ALL_CATEGORY_ASSET_CONTENT_TYPES } from "@/core/helpers/assets/categoryAssetContentTypes"


const categoryTranslationInputSchema = z.object({
    locale: localeSchema,
    name: z.string().min(2).max(100),
    slug: z.string().min(1).max(160).optional(),
})

const assetTypeEnum = z.enum([
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
]);

const assetRoleEnum = z.enum([
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "MODEL_3D",
    "CERTIFICATE",
])

export const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    url: z.string(), // ✅ runtime generated
    uploadStatus: z.enum(["PENDING_UPLOAD", "ACTIVE"]),
    uploadedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const categorySchema = z.object({
    id: z.uuid(),
    code: z.number().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    alternateSlugs: z.record(z.string(), z.string()).optional(),
    translations: z.array(z.object({
        id: z.uuid(),
        locale: z.string(),
        name: z.string(),
        slug: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })).optional(),
    allowedAttributeValueIds: z.array(z.string()).optional(),
    assets: z.array(assetSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).loose();

export const createCategoryValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.coerce.number().int().positive(),
            name: z.string().min(2).max(100),
            translations: z.array(categoryTranslationInputSchema).max(TRANSLATIONS_ARRAY_MAX).optional(),
            allowedAttributeValueIds: z.array(z.uuid()).optional(),
            // Görsel alanları BİLİNÇLİ olarak yok: görsel, kategori oluştuktan sonra
            // `POST /categories/assets/presign` ile eklenir — anahtarı ve satırı yalnız
            // sunucu üretir. İç body KATI olduğu için `assetKey` gönderen istek 400 alır.
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name"],
    }
)

export const getCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({ locale: localeSchema.optional() }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const slugValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            slug: z.string(),
        }),
        queryStringParameters: z.object({ locale: localeSchema.optional() }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            name: z.string().min(2).max(100).optional(),
            translations: z.array(categoryTranslationInputSchema).max(TRANSLATIONS_ARRAY_MAX).optional(),
            removeTranslationLocales: z.array(targetLocaleSchema).max(REMOVABLE_TRANSLATION_LOCALES_MAX).optional(),
            allowedAttributeValueIds: z.array(z.uuid()).optional(),
            // Görsel alanları yok — bkz. createCategoryValidator.
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const listCategoriesValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().max(500).optional(),
            search: z.string().trim().optional(),
            sort: z.enum(["code", "name", "createdAt"]).optional(),
            order: z.enum(["asc", "desc"]).optional(),
            locale: localeSchema.optional(),
        }).optional(),
    }).loose(),
    { requiredRootFields: [] },
)

// Response Validators
export const categoryResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                category: categorySchema
            })
        })
    }).loose()
)

export const listCategoryResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(categorySchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                })
            })
        })
    }).loose()
)

// Kategori görseli eklemenin TEK yolu: presign, var olan kategori için anahtarı ve
// PENDING_UPLOAD Asset satırını BİRLİKTE üretir; S3 ObjectCreated olayı satırı ACTIVE'e
// çevirir (confirmCategoryAssetUpload). İstemci anahtar seçemez, klasör kategorinin
// DB'deki slug'ından gelir. `contentType` izin listesinde olmalı (asset tipiyle uyumu
// handler denetler: `isAllowedCategoryAssetContentType`).
export const createCategoryAssetUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            categoryId: z.uuid(),
            assetRole: assetRoleEnum,
            assetType: assetTypeEnum,
            fileName: z.string().min(1).max(255),
            contentType: z.enum(ALL_CATEGORY_ASSET_CONTENT_TYPES),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["categoryId", "assetRole", "assetType", "fileName", "contentType"]
    }
)
