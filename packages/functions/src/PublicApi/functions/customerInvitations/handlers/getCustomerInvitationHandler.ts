import { getCustomerPortalInvitation } from "@/core/helpers/customerPortalInvitations/service"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICustomerInvitationDependencies,
    IGetCustomerInvitationEvent,
} from "@/functions/PublicApi/types/customerInvitations"

export const getCustomerInvitationHandler =
    ({ userInvitationRepository }: ICustomerInvitationDependencies) =>
        async (event: IGetCustomerInvitationEvent) => {
            const invitation = await getCustomerPortalInvitation({
                token: event.pathParameters.token,
                userInvitationRepository,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { invitation },
            })
        }
