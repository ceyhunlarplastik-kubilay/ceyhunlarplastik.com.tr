import createError from "http-errors"
import { updateUserProfile } from "@/core/helpers/users/updateUserProfile"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapAdminUserForApi } from "@/functions/AdminApi/functions/users/handlers/mapAdminUserForApi"
import type {
    IUpdateUserProfileEvent,
    IUpdateUserRoleDependencies,
} from "@/functions/AdminApi/types/users"

export const updateUserProfileHandler =
    (deps: IUpdateUserRoleDependencies) =>
        async (event: IUpdateUserProfileEvent) => {
            const requester = event.user
            if (!requester?.isOwner && !requester?.isAdmin) {
                throw new createError.Forbidden("Only admin/owner can update user profiles")
            }

            const { id } = event.pathParameters

            const updated = await updateUserProfile({
                userId: id,
                body: event.body,
                userRepository: deps.userRepository,
                cognitoRepository: deps.cognitoRepository,
                userPoolId: deps.userPoolId,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user: mapAdminUserForApi(updated),
                },
            })
        }
