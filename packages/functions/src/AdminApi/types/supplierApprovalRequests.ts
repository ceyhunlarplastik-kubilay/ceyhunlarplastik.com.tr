import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaSupplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"

export interface IAdminSupplierApprovalRequestDependencies {
    supplierApprovalRequestRepository: IPrismaSupplierApprovalRequestRepository
}

export type IListAdminSupplierApprovalRequestsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            status?: string
            type?: string
            supplierId?: string
        }
    >

export type IDecideSupplierApprovalRequestEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {
            approved: boolean
            note?: string
        },
        {
            id: string
        },
        {}
    >
