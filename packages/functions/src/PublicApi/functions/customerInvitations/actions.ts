import { lambdaHandler } from "@/core/middy"
import { Resource } from "sst"
import { cognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { userInvitationRepository } from "@/core/helpers/prisma/userInvitations/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import {
    acceptCustomerInvitationHandler,
    getCustomerInvitationHandler,
} from "@/functions/PublicApi/functions/customerInvitations/handlers"
import type {
    IAcceptCustomerInvitationEvent,
    IGetCustomerInvitationEvent,
} from "@/functions/PublicApi/types/customerInvitations"
import {
    acceptCustomerInvitationResponseValidator,
    acceptCustomerInvitationValidator,
    customerInvitationResponseValidator,
    getCustomerInvitationValidator,
} from "@/functions/PublicApi/validators/customerInvitations"

const deps = {
    userInvitationRepository: userInvitationRepository(),
    userRepository: userRepository(),
    cognitoRepository: cognitoUserRepository(),
    userPoolId: Resource.CeyhunlarUserPool.id,
}

export const getCustomerInvitation = lambdaHandler(
    async (event) => getCustomerInvitationHandler(deps)(event as IGetCustomerInvitationEvent),
    {
        auth: false,
        requestValidator: getCustomerInvitationValidator,
        responseValidator: customerInvitationResponseValidator,
    },
)

export const acceptCustomerInvitation = lambdaHandler(
    async (event) => acceptCustomerInvitationHandler(deps)(event as IAcceptCustomerInvitationEvent),
    {
        auth: false,
        requestValidator: acceptCustomerInvitationValidator,
        responseValidator: acceptCustomerInvitationResponseValidator,
    },
)
