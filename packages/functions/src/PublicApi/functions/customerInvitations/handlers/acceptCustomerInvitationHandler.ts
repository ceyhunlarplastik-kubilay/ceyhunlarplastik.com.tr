import createError from "http-errors"
import { acceptCustomerPortalInvitation } from "@/core/helpers/customerPortalInvitations/service"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IAcceptCustomerInvitationEvent,
    ICustomerInvitationDependencies,
} from "@/functions/PublicApi/types/customerInvitations"

export const acceptCustomerInvitationHandler =
    ({ userInvitationRepository, userRepository, cognitoRepository, userPoolId, customerRepository }: ICustomerInvitationDependencies) =>
        async (event: IAcceptCustomerInvitationEvent) => {
            if (!userRepository || !cognitoRepository || !userPoolId || !customerRepository) {
                throw new createError.InternalServerError("Customer invitation accept dependencies are not configured")
            }

            const result = await acceptCustomerPortalInvitation({
                token: event.body.token,
                password: event.body.password,
                userPoolId,
                userRepository,
                userInvitationRepository,
                cognitoRepository,
                customerRepository,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    email: result.user.email,
                    customerName: result.invitation.customerName,
                },
            })
        }
