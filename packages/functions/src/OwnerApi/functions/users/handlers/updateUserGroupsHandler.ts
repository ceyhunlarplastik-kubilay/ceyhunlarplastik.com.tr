import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { updateUserAccess } from "@/core/helpers/userAccess/service"
import type {
  IUpdateUserGroupsDependencies,
  IUpdateUserGroupsEvent,
} from "@/functions/OwnerApi/types/users";

export const updateUserGroupsHandler =
  ({ cognitoRepository, userRepository, supplierRepository, customerRepository, userPoolId, publishEvent }: IUpdateUserGroupsDependencies) =>
    async (event: IUpdateUserGroupsEvent) => {
      const requester = event.user!;
      const targetUserId = event.pathParameters.id;
      const { group, supplierId, customerId, accessStatus, reason } = event.body!;

      if (!requester.isOwner) throw createError.Forbidden("Only owners can change user roles");

      const user = await updateUserAccess({
        requester,
        targetUserId,
        nextGroup: group,
        supplierId,
        customerId,
        accessStatus,
        reason,
        deps: {
          cognitoRepository,
          userRepository,
          supplierRepository,
          customerRepository,
          userPoolId,
          publishEvent,
        },
      })

      return apiResponseDTO({
        statusCode: 200,
        payload: {
          user,
        },
      });
    };
