import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IUpdateWebRequestStatusEvent, IWebRequestDependencies } from "@/functions/AdminApi/types/webRequests"

export const updateWebRequestStatusHandler = ({ webRequestRepository }: IWebRequestDependencies) => {
    return async (event: IUpdateWebRequestStatusEvent) => {
        const { id } = event.pathParameters
        const { status } = event.body

        try {
            const request = await webRequestRepository.updateWebRequestStatus(id, status)

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    request,
                },
            })
        } catch (error: any) {
            if (error?.code === "P2025") {
                throw new createError.NotFound("Web request not found")
            }
            console.error(error)
            throw new createError.InternalServerError("Failed to update web request status")
        }
    }
}

