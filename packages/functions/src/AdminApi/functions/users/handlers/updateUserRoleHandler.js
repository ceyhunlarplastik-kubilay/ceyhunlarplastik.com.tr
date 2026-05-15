import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { updateUserAccess } from "@/core/helpers/userAccess/service";
export const updateUserRoleHandler = (deps) => async (event) => {
    const requester = event.user;
    const { id } = event.pathParameters;
    const { group, accessStatus, supplierId, customerId, reason, } = event.body;
    const user = await updateUserAccess({
        requester,
        targetUserId: id,
        nextGroup: group,
        supplierId,
        customerId,
        reason,
        accessStatus,
        deps,
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: {
            user,
        },
    });
};
