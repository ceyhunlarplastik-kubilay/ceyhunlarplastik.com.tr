import { lambdaHandler } from "@/core/middy"
import { productVariantCampaignRepository } from "@/core/helpers/prisma/productVariantCampaigns/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import {
    createProductVariantCampaignHandler,
    deleteProductVariantCampaignHandler,
    getProductVariantCampaignHandler,
    listProductVariantCampaignsHandler,
    updateProductVariantCampaignHandler,
} from "@/functions/ProtectedApi/functions/productVariantCampaigns/handlers"
import {
    createProductVariantCampaignValidator,
    deleteProductVariantCampaignValidator,
    getProductVariantCampaignValidator,
    listProductVariantCampaignsResponseValidator,
    listProductVariantCampaignsValidator,
    productVariantCampaignResponseValidator,
    updateProductVariantCampaignValidator,
} from "@/functions/ProtectedApi/validators/productVariantCampaigns"
import type {
    ICreateProductVariantCampaignEvent,
    IDeleteProductVariantCampaignEvent,
    IGetProductVariantCampaignEvent,
    IListProductVariantCampaignsEvent,
    IUpdateProductVariantCampaignEvent,
} from "@/functions/ProtectedApi/types/productVariantCampaigns"

/**
 * Kampanyayı yalnız satış müdürü, admin ve owner yönetir. Satış temsilcisi
 * (`sales`) kampanya OLUŞTURAMAZ; Aşama 2'de yalnız mevcut kampanyayı kendi
 * müşterilerine duyurabilecek.
 */
const campaignManagerGroups = ["sales_director", "admin", "owner"]

const deps = () => ({
    productVariantCampaignRepository: productVariantCampaignRepository(),
    productVariantRepository: productVariantRepository(),
})

export const listProductVariantCampaigns = lambdaHandler(
    async (event) => listProductVariantCampaignsHandler(deps())(event as IListProductVariantCampaignsEvent),
    {
        auth: { requiredPermissionGroups: campaignManagerGroups },
        requestValidator: listProductVariantCampaignsValidator,
        responseValidator: listProductVariantCampaignsResponseValidator,
    },
)

export const getProductVariantCampaign = lambdaHandler(
    async (event) => getProductVariantCampaignHandler(deps())(event as IGetProductVariantCampaignEvent),
    {
        auth: { requiredPermissionGroups: campaignManagerGroups },
        requestValidator: getProductVariantCampaignValidator,
        responseValidator: productVariantCampaignResponseValidator,
    },
)

export const createProductVariantCampaign = lambdaHandler(
    async (event) => createProductVariantCampaignHandler(deps())(event as ICreateProductVariantCampaignEvent),
    {
        auth: { requiredPermissionGroups: campaignManagerGroups },
        requestValidator: createProductVariantCampaignValidator,
        responseValidator: productVariantCampaignResponseValidator,
    },
)

export const updateProductVariantCampaign = lambdaHandler(
    async (event) => updateProductVariantCampaignHandler(deps())(event as IUpdateProductVariantCampaignEvent),
    {
        auth: { requiredPermissionGroups: campaignManagerGroups },
        requestValidator: updateProductVariantCampaignValidator,
        responseValidator: productVariantCampaignResponseValidator,
    },
)

export const deleteProductVariantCampaign = lambdaHandler(
    async (event) => deleteProductVariantCampaignHandler(deps())(event as IDeleteProductVariantCampaignEvent),
    {
        auth: { requiredPermissionGroups: campaignManagerGroups },
        requestValidator: deleteProductVariantCampaignValidator,
        responseValidator: productVariantCampaignResponseValidator,
    },
)
