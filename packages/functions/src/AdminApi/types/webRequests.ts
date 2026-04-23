import { IPrismaWebRequestRepository } from "@/core/helpers/prisma/webRequests/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

export interface IWebRequestDependencies {
    webRequestRepository: IPrismaWebRequestRepository
}

export type IListWebRequestsEvent =
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
        }
    >

export type IUpdateWebRequestStatusBody = {
    status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED"
}

export type IUpdateWebRequestStatusEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IUpdateWebRequestStatusBody,
        { id: string },
        {}
    >
