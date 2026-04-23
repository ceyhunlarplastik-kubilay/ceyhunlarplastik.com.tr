import { lambdaHandler } from "@/core/middy"
import { webRequestRepository } from "@/core/helpers/prisma/webRequests/repository"
import { listWebRequestsHandler, updateWebRequestStatusHandler } from "@/functions/AdminApi/functions/webRequests/handlers"
import { IListWebRequestsEvent, IUpdateWebRequestStatusEvent } from "@/functions/AdminApi/types/webRequests"
import {
    listWebRequestsResponseValidator,
    updateWebRequestStatusValidator,
    updateWebRequestStatusResponseValidator,
} from "@/functions/AdminApi/validators/webRequests"

export const listWebRequests = lambdaHandler(
    async (event) =>
        listWebRequestsHandler({
            webRequestRepository: webRequestRepository(),
        })(event as IListWebRequestsEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        responseValidator: listWebRequestsResponseValidator,
    }
)

export const updateWebRequestStatus = lambdaHandler(
    async (event) =>
        updateWebRequestStatusHandler({
            webRequestRepository: webRequestRepository(),
        })(event as IUpdateWebRequestStatusEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: updateWebRequestStatusValidator,
        responseValidator: updateWebRequestStatusResponseValidator,
    }
)
