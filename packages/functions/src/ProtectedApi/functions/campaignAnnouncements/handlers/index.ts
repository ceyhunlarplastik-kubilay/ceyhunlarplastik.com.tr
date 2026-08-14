import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    canViewCampaignAnnouncement,
    findInaccessibleCustomerIds,
    resolveAnnouncementOwnerFilter,
} from "@/core/helpers/crm/campaignAnnouncementAccess"
import type {
    ICampaignAnnouncementDependencies,
    ICreateCampaignAnnouncementEvent,
    IGetCampaignAnnouncementEvent,
    IListCampaignAnnouncementsEvent,
    IUpdateCampaignAnnouncementRecipientEvent,
} from "@/functions/ProtectedApi/types/campaignAnnouncements"

export const listCampaignAnnouncementsHandler = (
    { campaignAnnouncementRepository }: ICampaignAnnouncementDependencies,
) => {
    return async (event: IListCampaignAnnouncementsEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const query = event.queryStringParameters ?? {}

        const result = await campaignAnnouncementRepository.listAnnouncements({
            page: query.page ? Number(query.page) : undefined,
            limit: query.limit ? Number(query.limit) : undefined,
            search: query.search,
            campaignId: query.campaignId,
            customerId: query.customerId,
            status: query.status,
            // Temsilci kendi duyurularına sabitlenir; müdür/admin filtreleyebilir.
            createdByUserId: resolveAnnouncementOwnerFilter(requester, query.createdByUserId),
        })

        return apiResponseDTO({ statusCode: 200, payload: result })
    }
}

export const getCampaignAnnouncementHandler = (
    { campaignAnnouncementRepository }: ICampaignAnnouncementDependencies,
) => {
    return async (event: IGetCampaignAnnouncementEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const announcement = await campaignAnnouncementRepository.getAnnouncement(
            event.pathParameters.id,
        )
        if (!announcement) throw new createError.NotFound("Duyuru bulunamadı")

        if (!canViewCampaignAnnouncement(requester, announcement)) {
            throw new createError.Forbidden("Duyuruya erişim reddedildi")
        }

        return apiResponseDTO({ statusCode: 200, payload: { announcement } })
    }
}

export const createCampaignAnnouncementHandler = (
    deps: ICampaignAnnouncementDependencies,
) => {
    return async (event: ICreateCampaignAnnouncementEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const { campaignId, recipients, note } = event.body

        const campaign = await deps.productVariantCampaignRepository.getCampaign(campaignId)
        if (!campaign) throw new createError.NotFound("Kampanya bulunamadı")

        const uniqueCustomerIds = Array.from(new Set(recipients.map((item) => item.customerId)))

        // Müşteriler önce yüklenir: hem varlık doğrulaması hem de sahiplik
        // kontrolü için atanmış temsilci bilgisi gerekiyor.
        const customers = await Promise.all(
            uniqueCustomerIds.map(async (customerId) => {
                const customer = await deps.customerRepository.getCustomer(customerId)
                if (!customer) throw new createError.NotFound(`Müşteri bulunamadı: ${customerId}`)
                return customer
            }),
        )

        const inaccessible = findInaccessibleCustomerIds(requester, customers)
        if (inaccessible.length > 0) {
            throw new createError.Forbidden(
                `Bu müşterilere duyuru yapma yetkiniz yok: ${inaccessible.join(", ")}`,
            )
        }

        const announcement = await deps.campaignAnnouncementRepository.createAnnouncement({
            campaignId,
            createdByUserId: requester.id,
            note: note ?? null,
            recipients,
        })

        return apiResponseDTO({ statusCode: 201, payload: { announcement } })
    }
}

export const updateCampaignAnnouncementRecipientHandler = (
    { campaignAnnouncementRepository }: ICampaignAnnouncementDependencies,
) => {
    return async (event: IUpdateCampaignAnnouncementRecipientEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const { id, recipientId } = event.pathParameters

        const announcement = await campaignAnnouncementRepository.getAnnouncement(id)
        if (!announcement) throw new createError.NotFound("Duyuru bulunamadı")

        if (!canViewCampaignAnnouncement(requester, announcement)) {
            throw new createError.Forbidden("Duyuruya erişim reddedildi")
        }

        const recipient = await campaignAnnouncementRepository.getRecipient(recipientId)
        // Alıcı başka bir duyuruya aitse yol uydurulmuş demektir.
        if (!recipient || recipient.announcementId !== id) {
            throw new createError.NotFound("Duyuru alıcısı bulunamadı")
        }

        const { status, note } = event.body ?? {}
        const now = new Date()

        const updated = await campaignAnnouncementRepository.updateRecipient(recipientId, {
            ...(status !== undefined ? { status } : {}),
            ...(note !== undefined ? { note: note ?? null } : {}),
            // Zaman damgaları duruma göre TÜRETİLİR; istemci gönderemez.
            ...(status === "REACHED" ? { contactedAt: now } : {}),
            ...(status === "RESPONDED" ? { contactedAt: now, respondedAt: now } : {}),
        })

        if (!updated) throw new createError.NotFound("Duyuru bulunamadı")

        return apiResponseDTO({ statusCode: 200, payload: { announcement: updated } })
    }
}
