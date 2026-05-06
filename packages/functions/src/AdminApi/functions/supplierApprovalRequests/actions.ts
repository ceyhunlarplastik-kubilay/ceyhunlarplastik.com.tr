import { lambdaHandler } from "@/core/middy"
import { supplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"
import {
    decideSupplierApprovalRequestHandler,
    listSupplierApprovalRequestsHandler,
} from "@/functions/AdminApi/functions/supplierApprovalRequests/handlers"
import type {
    IAdminSupplierApprovalRequestDependencies,
    IDecideSupplierApprovalRequestEvent,
    IListAdminSupplierApprovalRequestsEvent,
} from "@/functions/AdminApi/types/supplierApprovalRequests"
import {
    decideSupplierApprovalRequestResponseValidator,
    decideSupplierApprovalRequestValidator,
    listSupplierApprovalRequestsResponseValidator,
} from "@/functions/AdminApi/validators/supplierApprovalRequests"

const getDeps = (): IAdminSupplierApprovalRequestDependencies => ({
    supplierApprovalRequestRepository: supplierApprovalRequestRepository(),
})

export const listSupplierApprovalRequests = lambdaHandler(
    async (event) =>
        listSupplierApprovalRequestsHandler(getDeps())(
            event as IListAdminSupplierApprovalRequestsEvent
        ),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        responseValidator: listSupplierApprovalRequestsResponseValidator,
    }
)

export const decideSupplierApprovalRequest = lambdaHandler(
    async (event) =>
        decideSupplierApprovalRequestHandler(getDeps())(
            event as IDecideSupplierApprovalRequestEvent
        ),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: decideSupplierApprovalRequestValidator,
        responseValidator: decideSupplierApprovalRequestResponseValidator,
    }
)
