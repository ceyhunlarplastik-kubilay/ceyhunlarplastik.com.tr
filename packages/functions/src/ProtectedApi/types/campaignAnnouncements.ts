import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaCampaignAnnouncementRepository } from "@/core/helpers/prisma/campaignAnnouncements/repository"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaProductVariantCampaignRepository } from "@/core/helpers/prisma/productVariantCampaigns/repository"

export interface ICampaignAnnouncementDependencies {
    campaignAnnouncementRepository: IPrismaCampaignAnnouncementRepository
    productVariantCampaignRepository: IPrismaProductVariantCampaignRepository
    customerRepository: IPrismaCustomerRepository
}

export type CampaignAnnouncementChannelInput = "MANUAL" | "EMAIL" | "WHATSAPP"

export type CampaignAnnouncementRecipientStatusInput =
    | "PENDING"
    | "REACHED"
    | "RESPONDED"
    | "NOT_INTERESTED"
    | "UNREACHABLE"

export type IListCampaignAnnouncementsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        campaignId?: string
        customerId?: string
        createdByUserId?: string
        status?: CampaignAnnouncementRecipientStatusInput
    }
>

export type IGetCampaignAnnouncementEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>

export type ICreateCampaignAnnouncementEvent = IAPIGatewayProxyEventWithUserGeneric<{
    campaignId: string
    note?: string | null
    recipients: Array<{
        customerId: string
        channel: CampaignAnnouncementChannelInput
    }>
}>

export type IUpdateCampaignAnnouncementRecipientEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        status?: CampaignAnnouncementRecipientStatusInput
        note?: string | null
    },
    { id: string; recipientId: string }
>
