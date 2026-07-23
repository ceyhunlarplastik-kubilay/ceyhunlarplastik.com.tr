import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"

const localeSchema = z.enum(["tr", "en"])
const dictionaryTranslationInputSchema = z.object({
    locale: localeSchema,
    name: z.string().min(1).max(100),
})
const dictionaryTranslationSchema = z.object({
    id: z.uuid(),
    locale: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createMaterialValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(1),
            code: z.string().optional(),
            translations: z.array(dictionaryTranslationInputSchema).max(10).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name"],
    }
)

export const updateMaterialValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            name: z.string().min(1).optional(),
            code: z.string().optional(),
            translations: z.array(dictionaryTranslationInputSchema).max(10).optional(),
            assetKey: z.string().optional(),
            assetType: z.enum(AssetType).optional(),
            assetRole: z.enum(AssetRole).optional(),
            mimeType: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const createMaterialAssetUploadValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            fileName: z.string().min(1),
            contentType: z.literal("application/pdf"),
            assetRole: z.enum(AssetRole).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["fileName", "contentType"],
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

// Response Validators
// Shape mapMaterialWithAssets çıktısından: {...material, assets: mapAsset[]}.
// mapAsset url türetiyor (asset.url ?? buildAssetUrl(key)); FK id/relation yok.
// loose: ileride include/spread genişlerse 500 üretmesin.
const materialAssetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: z.enum(AssetType),
    role: z.enum(AssetRole),
    url: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

const materialSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    translations: z.array(dictionaryTranslationSchema).optional(),
    code: z.string().nullish(), // Material.code String?
    createdAt: z.string(),
    updatedAt: z.string(),
    assets: z.array(materialAssetSchema),
}).loose()

// getMaterial / createMaterial / updateMaterial / deleteMaterial → payload: { material }
export const materialResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                material: materialSchema,
            }),
        }),
    }).loose()
)

// listMaterials → payload: { data, meta }
export const listMaterialResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(materialSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose()
)
