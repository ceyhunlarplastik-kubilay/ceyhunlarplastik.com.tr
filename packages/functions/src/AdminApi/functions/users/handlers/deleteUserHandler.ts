import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { deleteUser } from "@/core/helpers/users/deleteUser"
import type {
    IDeleteUserDependencies,
    IDeleteUserEvent,
} from "@/functions/AdminApi/types/users"

export const deleteUserHandler =
    (deps: IDeleteUserDependencies) =>
        async (event: IDeleteUserEvent) => {
            const requester = event.user
            if (!requester?.isOwner && !requester?.isAdmin) {
                throw new createError.Forbidden("Only admin/owner can delete users")
            }

            const { id } = event.pathParameters

            const result = await deleteUser({
                userId: id,
                requester,
                userRepository: deps.userRepository,
                cognitoRepository: deps.cognitoRepository,
                userPoolId: deps.userPoolId,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }
