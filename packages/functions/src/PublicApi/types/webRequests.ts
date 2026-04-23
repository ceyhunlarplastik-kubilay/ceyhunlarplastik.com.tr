import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaWebRequestRepository } from "@/core/helpers/prisma/webRequests/repository"

export interface IWebRequestDependencies {
    webRequestRepository: IPrismaWebRequestRepository
}

export type IWebRequestItem = {
    productId: string
    productSlug?: string
    productName?: string
    productCode?: string
    variantKey: string
    variantId?: string
    variantFullCode?: string | null
    quantity: number
}

export interface ICreateWebRequestBody {
    name: string
    email: string
    phone?: string
    message?: string
    items: IWebRequestItem[]
}

export type ICreateWebRequestEvent = IAPIGatewayProxyEventWithUserGeneric<ICreateWebRequestBody>

