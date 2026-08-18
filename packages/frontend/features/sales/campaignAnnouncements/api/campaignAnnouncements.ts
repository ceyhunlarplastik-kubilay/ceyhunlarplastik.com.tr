"use client"

import { protectedApiClient } from "@/lib/http/client"
import type {
    CampaignAnnouncement,
    CampaignAnnouncementListPayload,
    CampaignAnnouncementRecipientStatus,
    CreateCampaignAnnouncementInput,
} from "@/features/sales/campaignAnnouncements/api/types"

type ListResponse = { payload: CampaignAnnouncementListPayload }
type DetailResponse = { payload: { announcement: CampaignAnnouncement } }

const BASE = "/sales/campaign-announcements"

export type ListAnnouncementsParams = {
    page?: number
    limit?: number
    campaignId?: string
    customerId?: string
    createdByUserId?: string
    status?: CampaignAnnouncementRecipientStatus
}

export async function getCampaignAnnouncements(params: ListAnnouncementsParams = {}) {
    const res = await protectedApiClient.get<ListResponse>(BASE, { params })
    return res.data.payload
}

export async function createCampaignAnnouncement(input: CreateCampaignAnnouncementInput) {
    const res = await protectedApiClient.post<DetailResponse>(BASE, input)
    return res.data.payload.announcement
}

export async function updateCampaignAnnouncementRecipient(input: {
    announcementId: string
    recipientId: string
    status?: CampaignAnnouncementRecipientStatus
    note?: string | null
}) {
    const { announcementId, recipientId, ...body } = input
    const res = await protectedApiClient.patch<DetailResponse>(
        `${BASE}/${announcementId}/recipients/${recipientId}`,
        body,
    )
    return res.data.payload.announcement
}
