import createError from "http-errors";
import { apiResponse } from "@/core/helpers/utils/api/response";
import type {
  IUpdateUserGroupsDependencies,
  IUpdateUserGroupsEvent,
} from "@/functions/OwnerApi/types/users";

const ALL_GROUPS = ["owner", "admin", "user", "supplier", "purchasing", "sales", "customer"] as const;

export const updateUserGroupsHandler =
  ({ cognitoRepository, userRepository, supplierRepository, customerRepository, userPoolId }: IUpdateUserGroupsDependencies) =>
    async (event: IUpdateUserGroupsEvent) => {
      const requester = event.user!;
      const targetUserId = event.pathParameters.id;
      const { group: nextGroup, supplierId, customerId } = event.body!;

      /* ---------- Guards ---------- */
      if (!requester.isOwner) throw createError.Forbidden("Only owners can change user roles");

      const user = await userRepository.getUserById(targetUserId);
      if (!user) throw createError.NotFound("User not found");

      if (user.id === requester.id && nextGroup !== "owner") throw createError.Forbidden("Owner cannot remove own owner role");

      if (nextGroup === "supplier") {
        if (!supplierId) {
          throw createError.BadRequest("supplierId is required for supplier group");
        }
        const supplier = await supplierRepository.getSupplier(supplierId);
        if (!supplier) {
          throw createError.NotFound("Supplier not found");
        }
      }

      if (nextGroup === "customer") {
        if (!customerId) {
          throw createError.BadRequest("customerId is required for customer group");
        }
        const customer = await customerRepository.getCustomer(customerId);
        if (!customer) {
          throw createError.NotFound("Customer not found");
        }
      }

      /* ---------- Cognito sync ---------- */
      const currentGroups = user.groups;

      const toAdd = nextGroup;
      const toRemove = ALL_GROUPS.filter((g) => g !== nextGroup);

      console.log("toAdd", toAdd);
      console.log("toRemove", toRemove);

      // remove other groups
      for (const grp of toRemove) {
        if (currentGroups.includes(grp)) {
          await cognitoRepository.removeFromGroup(
            userPoolId,
            user.cognitoSub,
            grp,
          );
        }
      }

      // add new group if missing
      if (!currentGroups.includes(toAdd)) {
        await cognitoRepository.addToGroup(
          userPoolId,
          user.cognitoSub,
          toAdd,
        );
      }

      /* ---------- Prisma projection ---------- */

      await userRepository.updateAssignments(
        user.id,
        [toAdd],
        {
          supplierId: nextGroup === "supplier" ? supplierId : null,
          customerId: nextGroup === "customer" ? customerId : null,
        }
      );

      return apiResponse({
        statusCode: 200,
        payload: {
          success: true,
          userId: user.id,
          groups: [toAdd],
        },
      });
    };
