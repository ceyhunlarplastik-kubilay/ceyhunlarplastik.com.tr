import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { updateUserAccess } from "@/core/helpers/userAccess/service"
import { mapAdminUserForApi } from "@/functions/AdminApi/functions/users/handlers/mapAdminUserForApi"
import type {
    IUpdateUserRoleDependencies,
    IUpdateUserRoleEvent,
} from "@/functions/AdminApi/types/users"

export const updateUserRoleHandler =
    (deps: IUpdateUserRoleDependencies) =>
        async (event: IUpdateUserRoleEvent) => {
            const requester = event.user!
            const { id } = event.pathParameters
            const {
                group,
                accessStatus,
                supplierId,
                customerId,
                reason,
            } = event.body

            const user = await updateUserAccess({
                requester,
                targetUserId: id,
                nextGroup: group,
                supplierId,
                customerId,
                reason,
                accessStatus,
                deps,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user: mapAdminUserForApi(user),
                },
            })
        }
