import { lambdaHandler } from "@/core/middy"
import { businessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import {
    decideAdminBusinessRequestHandler,
    listAdminBusinessRequestsHandler,
} from "@/functions/AdminApi/functions/businessRequests/handlers"
import type {
    IDecideAdminBusinessRequestEvent,
    IListAdminBusinessRequestsEvent,
} from "@/functions/AdminApi/types/businessRequests"
import {
    businessRequestDecisionResponseValidator,
    businessRequestListResponseValidator,
    decideBusinessRequestValidator,
    listBusinessRequestsValidator,
} from "@/functions/AdminApi/validators/businessRequests"

const deps = {
    businessRequestRepository: businessRequestRepository(),
    customerRepository: customerRepository(),
}

export const listBusinessRequests = lambdaHandler(
    async (event) => listAdminBusinessRequestsHandler(deps)(event as IListAdminBusinessRequestsEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: listBusinessRequestsValidator,
        responseValidator: businessRequestListResponseValidator,
    },
)

export const decideBusinessRequest = lambdaHandler(
    async (event) => decideAdminBusinessRequestHandler(deps)(event as IDecideAdminBusinessRequestEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: decideBusinessRequestValidator,
        responseValidator: businessRequestDecisionResponseValidator,
    },
)
