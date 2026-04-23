import { lambdaHandler } from "@/core/middy"
import { webRequestRepository } from "@/core/helpers/prisma/webRequests/repository"
import { createWebRequestHandler } from "@/functions/PublicApi/functions/webRequests/handlers"
import { ICreateWebRequestEvent } from "@/functions/PublicApi/types/webRequests"
import { createWebRequestValidator, webRequestResponseValidator } from "@/functions/PublicApi/validators/webRequests"

export const createWebRequest = lambdaHandler(
    async (event) =>
        createWebRequestHandler({
            webRequestRepository: webRequestRepository(),
        })(event as ICreateWebRequestEvent),
    {
        auth: false,
        requestValidator: createWebRequestValidator,
        responseValidator: webRequestResponseValidator,
    }
)

