import createError from "http-errors"
import { updateUserProfile } from "@/core/helpers/users/updateUserProfile"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapAdminUserForApi } from "@/functions/AdminApi/functions/users/handlers/mapAdminUserForApi"
import type {
    IMyProfileDependencies,
    IUpdateMyProfileEvent,
} from "@/functions/ProtectedApi/types/users"

export const updateMyProfileHandler =
    ({ userRepository, cognitoRepository, userPoolId }: IMyProfileDependencies) =>
        async (event: IUpdateMyProfileEvent) => {
            const authUser = event.user
            const authCognitoSub =
                authUser?.cognitoSub
                ?? event.requestContext.authorizer?.jwt?.claims?.sub

            if (!authUser) {
                throw new createError.Unauthorized("User context missing")
            }

            if (!authCognitoSub) {
                throw new createError.Unauthorized("Authenticated user subject missing")
            }

            const updated = await updateUserProfile({
                userId: authUser.id,
                body: event.body ?? {},
                userRepository,
                cognitoRepository,
                userPoolId,
                expectedCognitoSub: authCognitoSub,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user: mapAdminUserForApi(updated),
                },
            })
        }
