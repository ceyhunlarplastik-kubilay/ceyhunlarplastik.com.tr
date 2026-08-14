import { lambdaHandler } from "@/core/middy"
import { campaignAnnouncementRepository } from "@/core/helpers/prisma/campaignAnnouncements/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { productVariantCampaignRepository } from "@/core/helpers/prisma/productVariantCampaigns/repository"
import {
    createCampaignAnnouncementHandler,
    getCampaignAnnouncementHandler,
    listCampaignAnnouncementsHandler,
    updateCampaignAnnouncementRecipientHandler,
} from "@/functions/ProtectedApi/functions/campaignAnnouncements/handlers"
import {
    campaignAnnouncementResponseValidator,
    createCampaignAnnouncementValidator,
    getCampaignAnnouncementValidator,
    listCampaignAnnouncementsResponseValidator,
    listCampaignAnnouncementsValidator,
    updateCampaignAnnouncementRecipientValidator,
} from "@/functions/ProtectedApi/validators/campaignAnnouncements"
import type {
    ICreateCampaignAnnouncementEvent,
    IGetCampaignAnnouncementEvent,
    IListCampaignAnnouncementsEvent,
    IUpdateCampaignAnnouncementRecipientEvent,
} from "@/functions/ProtectedApi/types/campaignAnnouncements"

/**
 * Kampanyayı satış müdürü/admin OLUŞTURUR; duyuruyu ise sahadaki TEMSİLCİ yapar.
 * Bu yüzden `sales` burada var, kampanya yönetim uçlarında yok. Kapsam
 * daraltması handler'da: temsilci yalnız kendi müşterilerine duyuru yapabilir.
 */
const announcementGroups = ["sales", "sales_director", "admin", "owner"]

const deps = () => ({
    campaignAnnouncementRepository: campaignAnnouncementRepository(),
    productVariantCampaignRepository: productVariantCampaignRepository(),
    customerRepository: customerRepository(),
})

export const listCampaignAnnouncements = lambdaHandler(
    async (event) => listCampaignAnnouncementsHandler(deps())(event as IListCampaignAnnouncementsEvent),
    {
        auth: { requiredPermissionGroups: announcementGroups },
        requestValidator: listCampaignAnnouncementsValidator,
        responseValidator: listCampaignAnnouncementsResponseValidator,
    },
)

export const getCampaignAnnouncement = lambdaHandler(
    async (event) => getCampaignAnnouncementHandler(deps())(event as IGetCampaignAnnouncementEvent),
    {
        auth: { requiredPermissionGroups: announcementGroups },
        requestValidator: getCampaignAnnouncementValidator,
        responseValidator: campaignAnnouncementResponseValidator,
    },
)

export const createCampaignAnnouncement = lambdaHandler(
    async (event) => createCampaignAnnouncementHandler(deps())(event as ICreateCampaignAnnouncementEvent),
    {
        auth: { requiredPermissionGroups: announcementGroups },
        requestValidator: createCampaignAnnouncementValidator,
        responseValidator: campaignAnnouncementResponseValidator,
    },
)

export const updateCampaignAnnouncementRecipient = lambdaHandler(
    async (event) =>
        updateCampaignAnnouncementRecipientHandler(deps())(
            event as IUpdateCampaignAnnouncementRecipientEvent,
        ),
    {
        auth: { requiredPermissionGroups: announcementGroups },
        requestValidator: updateCampaignAnnouncementRecipientValidator,
        responseValidator: campaignAnnouncementResponseValidator,
    },
)
