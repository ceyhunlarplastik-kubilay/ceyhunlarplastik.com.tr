import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/**
 * Duyuru yüzeyi. Kanal ALICI bazındadır (bir müşteri aranır, diğerine mail
 * atılır). Bu aşamada hiçbir otomatik ileti gitmediği için gönderim alanları yok.
 *
 * `.default()` kullanılmaz — union altına girdiğinde ajv strict mode derlemeyi
 * reddediyor (bkz. CLAUDE.md tuzakları); varsayılanlar handler'da uygulanır.
 */

const channelEnum = z.enum(["MANUAL", "EMAIL", "WHATSAPP"])
const statusEnum = z.enum(["PENDING", "REACHED", "RESPONDED", "NOT_INTERESTED", "UNREACHABLE"])

export const listCampaignAnnouncementsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().optional(),
            sort: z.string().optional(),
            order: z.string().optional(),
            campaignId: z.uuid().optional(),
            customerId: z.uuid().optional(),
            createdByUserId: z.uuid().optional(),
            status: statusEnum.optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

export const getCampaignAnnouncementValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid() }),
    }),
    { requiredRootFields: ["pathParameters"] },
)

export const createCampaignAnnouncementValidator = validatorWrapper(
    z.object({
        body: z.object({
            campaignId: z.uuid(),
            note: z.string().trim().max(5000).nullable().optional(),
            recipients: z.array(
                z.object({
                    customerId: z.uuid(),
                    channel: channelEnum,
                }).strict(),
            ).min(1).max(500),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["campaignId", "recipients"],
    },
)

export const updateCampaignAnnouncementRecipientValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            recipientId: z.uuid(),
        }),
        body: z.object({
            status: statusEnum.optional(),
            note: z.string().trim().max(5000).nullable().optional(),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

// ---- Response ----

const userSummarySchema = z.object({
    id: z.uuid(),
    email: z.string(),
    identifier: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    groups: z.array(z.string()).optional(),
}).loose()

const recipientSchema = z.object({
    id: z.uuid(),
    announcementId: z.uuid(),
    customerId: z.uuid(),
    channel: channelEnum,
    status: statusEnum,
    note: z.string().nullable().optional(),
    contactedAt: z.string().nullable().optional(),
    respondedAt: z.string().nullable().optional(),
    customer: z.object({
        id: z.uuid(),
        fullName: z.string(),
    }).loose().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

const announcementSchema = z.object({
    id: z.uuid(),
    campaignId: z.uuid(),
    createdByUserId: z.uuid(),
    note: z.string().nullable().optional(),
    createdByUser: userSummarySchema.nullable().optional(),
    // Prisma Decimal JSON'da {s,e,d} objesi olabildiği için tip dayatılmaz.
    campaign: z.object({ id: z.uuid(), title: z.string() }).loose().nullable().optional(),
    recipients: z.array(recipientSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const campaignAnnouncementResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ announcement: announcementSchema }),
        }),
    }).loose(),
)

export const listCampaignAnnouncementsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(announcementSchema),
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
