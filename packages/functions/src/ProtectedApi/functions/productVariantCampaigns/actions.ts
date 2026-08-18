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
 * OKUMA ve YAZMA ayrı: kampanyayı yalnız satış müdürü/admin/owner OLUŞTURUP
 * düzenler, ama satış temsilcisi kampanyayı GÖREBİLMELİ — duyuru yapabilmesi
 * için kampanya listesine erişmesi şart (Aşama 2).
 */
const campaignReaderGroups = ["sales", "sales_director", "admin", "owner"]
const campaignManagerGroups = ["sales_director", "admin", "owner"]

const deps = () => ({
    productVariantCampaignRepository: productVariantCampaignRepository(),
    productVariantRepository: productVariantRepository(),
})

export const listProductVariantCampaigns = lambdaHandler(
    async (event) => listProductVariantCampaignsHandler(deps())(event as IListProductVariantCampaignsEvent),
    {
        auth: { requiredPermissionGroups: campaignReaderGroups },
        requestValidator: listProductVariantCampaignsValidator,
        responseValidator: listProductVariantCampaignsResponseValidator,
    },
)

export const getProductVariantCampaign = lambdaHandler(
    async (event) => getProductVariantCampaignHandler(deps())(event as IGetProductVariantCampaignEvent),
    {
        auth: { requiredPermissionGroups: campaignReaderGroups },
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
