import type { IPrismaBusinessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type {
    BusinessRequestDomain,
    BusinessRequestStatus,
    BusinessRequestType,
} from "@/prisma/generated/prisma/client"

export interface IAdminBusinessRequestDependencies {
    businessRequestRepository: IPrismaBusinessRequestRepository
    customerRepository: IPrismaCustomerRepository
}

export type IListAdminBusinessRequestsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        status?: BusinessRequestStatus
        type?: BusinessRequestType
        domain?: BusinessRequestDomain
    }
>

export type IDecideAdminBusinessRequestEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        approved?: boolean
        action?: "APPROVE" | "REJECT" | "COUNTER"
        note?: string
        counterOfferItems?: Array<{
            requestItemId: string
            proposedUnitPrice: number
            currency?: string | null
        }>
    },
    { id: string }
>
