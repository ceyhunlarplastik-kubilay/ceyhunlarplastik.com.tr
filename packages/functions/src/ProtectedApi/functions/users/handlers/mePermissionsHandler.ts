import createError from "http-errors";
import { apiResponse } from "@/core/helpers/utils/api/response";
import {
    IMePermissionsEvent,
} from "@/functions/ProtectedApi/types/users";

export const mePermissionsHandler =
    () =>
        async (event: IMePermissionsEvent) => {
            const user = event.user;

            if (!user) {
                throw createError.Unauthorized("User context missing");
            }

            /**
             * 🔐 Permission matrix
             * Burası ileride feature-based genişletilebilir
             */
            const permissions = {
                roles: user.groups,

                flags: {
                    isOwner: user.isOwner,
                    isAdmin: user.isAdmin,
                    isSupplier: user.isSupplier,
                    isPurchasing: user.isPurchasing,
                    isSales: user.isSales,
                    isUser: user.groups.includes("user"),
                },

                can: {
                    manageUsers: user.isOwner || user.isAdmin,
                    viewUsers: user.groups.length > 0,
                    accessAdminPanel: user.isOwner || user.isAdmin,
                    accessSupplierPanel: user.isSupplier,
                    accessPurchasingPanel: user.isPurchasing || user.isAdmin || user.isOwner,
                    accessSalesPanel: user.isSales || user.isAdmin || user.isOwner,
                    accessProtectedApi: true,
                },
            };

            return apiResponse({
                statusCode: 200,
                payload: permissions,
            });
        };
