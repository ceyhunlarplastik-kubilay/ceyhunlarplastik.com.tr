import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductVariantCampaignRepository } from "@/core/helpers/prisma/productVariantCampaigns/repository"
import type { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"

export interface IProductVariantCampaignDependencies {
    productVariantCampaignRepository: IPrismaProductVariantCampaignRepository
    productVariantRepository: IPrismaProductVariantRepository
}

export type IProductVariantCampaignItemBody = {
    productVariantId: string
    discountPercent?: number | null
}

export type IProductVariantCampaignBody = {
    title: string
    description?: string | null
    discountPercent: number
    validFrom?: string | null
    validUntil?: string | null
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED"
    items: IProductVariantCampaignItemBody[]
}

export type IListProductVariantCampaignsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: string
        status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED"
        productVariantId?: string
        currentOnly?: "true" | "false"
    }
>

export type IGetProductVariantCampaignEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>

export type ICreateProductVariantCampaignEvent =
    IAPIGatewayProxyEventWithUserGeneric<IProductVariantCampaignBody>

export type IUpdateProductVariantCampaignEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<IProductVariantCampaignBody>,
    { id: string }
>

export type IDeleteProductVariantCampaignEvent = IGetProductVariantCampaignEvent

/** Portal ucu: müşteri kimliği token'dan gelir, path/query almaz. */
export type IPortalProductVariantCampaignsEvent = IAPIGatewayProxyEventWithUserGeneric
