import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type {
    CampaignAnnouncement,
    CampaignAnnouncementChannel,
    CampaignAnnouncementRecipientStatus,
    Prisma,
} from "@/prisma/generated/prisma/client"

const userSummarySelect = {
    id: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
    groups: true,
} as const

/**
 * Alıcı satırı müşterinin yalnız kimlik/iletişim bilgisini taşır; ticari alanlar
 * (iskonto, kredi limiti) takip listesinde gereksiz ve payload'ı şişirir.
 */
const announcementInclude = {
    createdByUser: { select: userSummarySelect },
    campaign: {
        select: {
            id: true,
            title: true,
            discountPercent: true,
            status: true,
            validFrom: true,
            validUntil: true,
        },
    },
    recipients: {
        orderBy: { createdAt: "asc" },
        include: {
            customer: {
                select: {
                    id: true,
                    fullName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                    assignedSalesUserId: true,
                },
            },
        },
    },
} satisfies Prisma.CampaignAnnouncementInclude

export type CampaignAnnouncementWithRelations = Prisma.CampaignAnnouncementGetPayload<{
    include: typeof announcementInclude
}>

export type CampaignAnnouncementListQuery = IPaginationQuery & {
    campaignId?: string
    /** Belirli müşteriyi içeren duyurular. */
    customerId?: string
    /** Yöneticinin açık temsilci filtresi. */
    createdByUserId?: string
    /**
     * Temsilci kapsamı: duyuruyu bu kullanıcı oluşturmuş VEYA duyuru bu
     * kullanıcının müşterilerinden birini hedefliyor olmalı.
     */
    salesScopeUserId?: string
    status?: CampaignAnnouncementRecipientStatus
}

export type CampaignAnnouncementRecipientInput = {
    customerId: string
    channel: CampaignAnnouncementChannel
}

export type CampaignAnnouncementRecipientPatch = {
    status?: CampaignAnnouncementRecipientStatus
    note?: string | null
    contactedAt?: Date | null
    respondedAt?: Date | null
}

export interface IPrismaCampaignAnnouncementRepository {
    listAnnouncements(query: CampaignAnnouncementListQuery): Promise<{
        data: CampaignAnnouncementWithRelations[]
        meta: { page: number; limit: number; total: number; totalPages: number }
    }>
    getAnnouncement(id: string): Promise<CampaignAnnouncementWithRelations | null>
    createAnnouncement(input: {
        campaignId: string
        createdByUserId: string
        note?: string | null
        recipients: CampaignAnnouncementRecipientInput[]
    }): Promise<CampaignAnnouncementWithRelations>
    updateRecipient(
        recipientId: string,
        patch: CampaignAnnouncementRecipientPatch,
    ): Promise<CampaignAnnouncementWithRelations | null>
    getRecipient(recipientId: string): Promise<
        { id: string; announcementId: string; customerId: string } | null
    >
}

function toRecipientCreateData(recipients: CampaignAnnouncementRecipientInput[]) {
    // Aynı müşteri iki kez gelirse unique kısıt patlar; girişte tekilleştiriyoruz.
    const seen = new Set<string>()

    return recipients
        .filter((recipient) => {
            if (!recipient.customerId || seen.has(recipient.customerId)) return false
            seen.add(recipient.customerId)
            return true
        })
        .map((recipient) => ({
            customerId: recipient.customerId,
            channel: recipient.channel,
        }))
}

export const campaignAnnouncementRepository = (): IPrismaCampaignAnnouncementRepository => {
    const getAnnouncement = async (id: string) =>
        prisma.campaignAnnouncement.findUnique({
            where: { id },
            include: announcementInclude,
        })

    const listAnnouncements = async (query: CampaignAnnouncementListQuery) => {
        const { where, orderBy, skip, take, page, limit } =
            buildPaginationQuery<CampaignAnnouncement>(query, {
                searchableFields: ["note"],
                defaultSort: "createdAt",
            })

        const finalWhere: Prisma.CampaignAnnouncementWhereInput = {
            ...where,
            ...(query.campaignId ? { campaignId: query.campaignId } : {}),
            ...(query.createdByUserId ? { createdByUserId: query.createdByUserId } : {}),
            // Temsilci kapsamı: kendi oluşturdukları VEYA kendi müşterilerini
            // hedefleyenler. Yönetici bir temsilcinin portföyü için duyuru
            // oluşturduğunda takibi yapacak kişi o duyuruyu görmeli.
            ...(query.salesScopeUserId
                ? {
                    OR: [
                        { createdByUserId: query.salesScopeUserId },
                        {
                            recipients: {
                                some: { customer: { assignedSalesUserId: query.salesScopeUserId } },
                            },
                        },
                    ],
                }
                : {}),
            // Müşteri ve durum filtreleri alıcı satırları üzerinden uygulanır.
            ...(query.customerId || query.status
                ? {
                    recipients: {
                        some: {
                            ...(query.customerId ? { customerId: query.customerId } : {}),
                            ...(query.status ? { status: query.status } : {}),
                        },
                    },
                }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.campaignAnnouncement.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: announcementInclude,
            }),
            prisma.campaignAnnouncement.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const createAnnouncement = async (input: {
        campaignId: string
        createdByUserId: string
        note?: string | null
        recipients: CampaignAnnouncementRecipientInput[]
    }) =>
        prisma.campaignAnnouncement.create({
            data: {
                campaignId: input.campaignId,
                createdByUserId: input.createdByUserId,
                note: input.note ?? null,
                recipients: { create: toRecipientCreateData(input.recipients) },
            },
            include: announcementInclude,
        })

    const getRecipient = async (recipientId: string) =>
        prisma.campaignAnnouncementRecipient.findUnique({
            where: { id: recipientId },
            select: { id: true, announcementId: true, customerId: true },
        })

    const updateRecipient = async (
        recipientId: string,
        patch: CampaignAnnouncementRecipientPatch,
    ) => {
        const updated = await prisma.campaignAnnouncementRecipient.update({
            where: { id: recipientId },
            data: patch,
            select: { announcementId: true },
        })

        return getAnnouncement(updated.announcementId)
    }

    return {
        listAnnouncements,
        getAnnouncement,
        createAnnouncement,
        updateRecipient,
        getRecipient,
    }
}
