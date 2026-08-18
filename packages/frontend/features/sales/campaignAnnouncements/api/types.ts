import type { UserSummary } from "@/features/admin/customers/api/types"

export type CampaignAnnouncementChannel = "MANUAL" | "EMAIL" | "WHATSAPP"

export type CampaignAnnouncementRecipientStatus =
    | "PENDING"
    | "REACHED"
    | "RESPONDED"
    | "NOT_INTERESTED"
    | "UNREACHABLE"

export type CampaignAnnouncementRecipient = {
    id: string
    announcementId: string
    customerId: string
    channel: CampaignAnnouncementChannel
    status: CampaignAnnouncementRecipientStatus
    note?: string | null
    contactedAt?: string | null
    respondedAt?: string | null
    customer?: {
        id: string
        fullName: string | null
        companyName?: string | null
        email?: string | null
        phone?: string | null
    }
    createdAt: string
    updatedAt: string
}

export type CampaignAnnouncement = {
    id: string
    campaignId: string
    createdByUserId: string
    note?: string | null
    createdByUser?: UserSummary | null
    campaign?: { id: string; title: string; status?: string } | null
    recipients?: CampaignAnnouncementRecipient[]
    createdAt: string
    updatedAt: string
}

export type CampaignAnnouncementListPayload = {
    data: CampaignAnnouncement[]
    meta: { page: number; limit: number; total: number; totalPages: number }
}

export type CreateCampaignAnnouncementInput = {
    campaignId: string
    note?: string | null
    recipients: Array<{ customerId: string; channel: CampaignAnnouncementChannel }>
}
