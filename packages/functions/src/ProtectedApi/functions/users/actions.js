import { lambdaHandler } from "@/core/middy";
import { userRepository } from "@/core/helpers/prisma/users/repository";
import { userNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository";
import { listUsersHandler, getUserHandler, getMeHandler, getMyAccessHandler, listMyNotificationsHandler, markMyNotificationReadHandler, mePermissionsHandler, } from "@/functions/ProtectedApi/functions/users/handlers";
export const listUsers = lambdaHandler(async (event) => {
    const deps = {
        userRepository: userRepository(),
    };
    return listUsersHandler(deps)(event);
}, {
    auth: {
        requiredPermissionGroups: ["user"],
    },
});
export const getUser = lambdaHandler(async (event) => {
    const deps = {
        userRepository: userRepository(),
    };
    return getUserHandler(deps)(event);
}, {
    auth: {
        requiredPermissionGroups: ["user"],
    },
});
export const getMe = lambdaHandler(async (event) => {
    const deps = {
        userRepository: userRepository(),
    };
    return getMeHandler(deps)(event);
}, {
    auth: {},
});
export const getMyAccess = lambdaHandler(async (event) => getMyAccessHandler({
    userRepository: userRepository(),
})(event), {
    auth: {
        allowInactive: true,
    },
});
export const listMyNotifications = lambdaHandler(async (event) => listMyNotificationsHandler({
    userNotificationRepository: userNotificationRepository(),
})(event), {
    auth: {
        allowInactive: true,
    },
});
export const markMyNotificationRead = lambdaHandler(async (event) => markMyNotificationReadHandler({
    userNotificationRepository: userNotificationRepository(),
})(event), {
    auth: {
        allowInactive: true,
    },
});
export const mePermissions = lambdaHandler(async (event) => {
    const deps = {
        userRepository: userRepository(),
    };
    return mePermissionsHandler()(event);
}, {
    auth: {},
});
