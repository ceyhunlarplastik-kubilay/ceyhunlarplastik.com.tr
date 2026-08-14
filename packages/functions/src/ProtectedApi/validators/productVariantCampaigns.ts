import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/**
 * Kampanya yüzeyi. Kampanya MÜŞTERİYE ÖZEL DEĞİLDİR — şemada `customerId` hiç
 * yoktur; müşteriye özel pazarlık `CustomerVariantSpecialPrice` yüzeyine aittir.
 *
 * Not: burada `.default()` KULLANILMAZ. Şema `.nullish()`/union altına girdiğinde
 * ajv strict mode derlemeyi reddediyor (bkz. CLAUDE.md tuzakları); varsayılanlar
 * handler tarafında uygulanır.
 */

const campaignStatusEnum = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED"])

const discountPercentSchema = z.number().min(0).max(100)

const campaignItemSchema = z.object({
    productVariantId: z.uuid(),
    /** Doluysa kampanya genelindeki oranın yerine geçer. */
    discountPercent: discountPercentSchema.nullable().optional(),
}).strict()

const campaignBodySchema = z.object({
    title: z.string().trim().min(2).max(255),
    description: z.string().trim().max(5000).nullable().optional(),
    discountPercent: discountPercentSchema,
    validFrom: z.iso.datetime().nullable().optional(),
    validUntil: z.iso.datetime().nullable().optional(),
    status: campaignStatusEnum.optional(),
    items: z.array(campaignItemSchema).min(1).max(500),
})

export const listProductVariantCampaignsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().optional(),
            sort: z.string().optional(),
            order: z.string().optional(),
            status: campaignStatusEnum.optional(),
            productVariantId: z.uuid().optional(),
            currentOnly: z.enum(["true", "false"]).optional(),
        }).optional(),
    }),
    {
        requiredRootFields: [],
    },
)

export const getProductVariantCampaignValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const createProductVariantCampaignValidator = validatorWrapper(
    z.object({
        body: campaignBodySchema,
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["title", "discountPercent", "items"],
    },
)

export const updateProductVariantCampaignValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        // Kalem listesi gönderilmezse mevcut kalemlere dokunulmaz.
        body: campaignBodySchema.partial(),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const deleteProductVariantCampaignValidator = getProductVariantCampaignValidator

// ---- Response ----

const userSummarySchema = z.object({
    id: z.uuid(),
    email: z.string(),
    identifier: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    groups: z.array(z.string()).optional(),
}).loose()

const campaignItemResponseSchema = z.object({
    id: z.uuid(),
    campaignId: z.uuid(),
    productVariantId: z.uuid(),
    discountPercent: z.unknown().nullable().optional(),
    displayOrder: z.number(),
    productVariant: z.object({
        id: z.uuid(),
        name: z.string(),
        fullCode: z.string(),
    }).loose().optional(),
}).loose()

const campaignResponseSchema = z.object({
    id: z.uuid(),
    title: z.string(),
    description: z.string().nullable().optional(),
    // Prisma Decimal JSON'da {s,e,d} objesi olarak serialize olur; şema bu yüzden
    // tip dayatmaz (bkz. CLAUDE.md tuzakları).
    discountPercent: z.unknown(),
    validFrom: z.string().nullable().optional(),
    validUntil: z.string().nullable().optional(),
    status: campaignStatusEnum,
    createdByUserId: z.uuid(),
    createdByUser: userSummarySchema.nullable().optional(),
    items: z.array(campaignItemResponseSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const productVariantCampaignResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                campaign: campaignResponseSchema,
            }),
        }),
    }).loose(),
)

export const listProductVariantCampaignsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(campaignResponseSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }).loose(),
            }),
        }),
    }).loose(),
)

export const portalProductVariantCampaignsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(campaignResponseSchema),
            }),
        }),
    }).loose(),
)
