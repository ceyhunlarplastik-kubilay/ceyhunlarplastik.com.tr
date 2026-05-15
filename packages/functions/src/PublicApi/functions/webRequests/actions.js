import { lambdaHandler } from "@/core/middy";
import { webRequestRepository } from "@/core/helpers/prisma/webRequests/repository";
import { createWebRequestHandler } from "@/functions/PublicApi/functions/webRequests/handlers";
import { createWebRequestValidator, webRequestResponseValidator } from "@/functions/PublicApi/validators/webRequests";
export const createWebRequest = lambdaHandler(async (event) => createWebRequestHandler({
    webRequestRepository: webRequestRepository(),
})(event), {
    auth: false,
    requestValidator: createWebRequestValidator,
    responseValidator: webRequestResponseValidator,
});
