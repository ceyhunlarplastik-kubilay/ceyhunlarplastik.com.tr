import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateWebRequestEvent, IWebRequestDependencies } from "@/functions/PublicApi/types/webRequests"

export const createWebRequestHandler = ({ webRequestRepository }: IWebRequestDependencies) => {
    return async (event: ICreateWebRequestEvent) => {
        const { name, email, phone, message, items } = event.body

        try {
            const request = await webRequestRepository.createWebRequest({
                name,
                email,
                phone,
                message,
                items,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: {
                    request,
                },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error)
            throw new createError.InternalServerError("Failed to create web request")
        }
    }
}

