import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { userNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"
import {
    listUsersHandler,
    getUserHandler,
    getMeHandler,
    getMyAccessHandler,
    listMyNotificationsHandler,
    markMyNotificationReadHandler,
    mePermissionsHandler,
    createMyProfileImageUploadHandler,
    updateMyProfileImageHandler,
} from "@/functions/ProtectedApi/functions/users/handlers"
import {
    IListUsersDependencies,
    IGetUserDependencies,
    IListUsersEvent,
    IGetUserEvent,
    IGetMyAccessEvent,
    IListMyNotificationsEvent,
    IMarkMyNotificationReadEvent,
    IMePermissionsEvent,
    ICreateMyProfileImageUploadEvent,
    IUpdateMyProfileImageEvent,
} from "@/functions/ProtectedApi/types/users"
import {
    createMyProfileImageUploadValidator,
    updateMyProfileImageValidator,
} from "@/functions/ProtectedApi/validators/users"

export const listUsers = lambdaHandler(
    async (event) => {
        const deps: IListUsersDependencies = {
            userRepository: userRepository(),
        }

        return listUsersHandler(deps)(
            event as IListUsersEvent
        )
    },
    {
        auth: {
            requiredPermissionGroups: ["user"],
        },
    }
)

export const getUser = lambdaHandler(
    async (event) => {
        const deps: IGetUserDependencies = {
            userRepository: userRepository(),
        }

        return getUserHandler(deps)(
            event as IGetUserEvent
        )
    },
    {
        auth: {
            requiredPermissionGroups: ["user"],
        },
    }
)

export const getMe = lambdaHandler(
    async (event) => {
        const deps = {
            userRepository: userRepository(),
        };

        return getMeHandler(deps)(event);
    },
    {
        auth: {},
    }
);

export const getMyAccess = lambdaHandler(
    async (event) =>
        getMyAccessHandler({
            userRepository: userRepository(),
        })(event as IGetMyAccessEvent),
    {
        auth: {
            allowInactive: true,
        },
    }
)

export const listMyNotifications = lambdaHandler(
    async (event) =>
        listMyNotificationsHandler({
            userNotificationRepository: userNotificationRepository(),
        })(event as IListMyNotificationsEvent),
    {
        auth: {
            allowInactive: true,
        },
    }
)

export const markMyNotificationRead = lambdaHandler(
    async (event) =>
        markMyNotificationReadHandler({
            userNotificationRepository: userNotificationRepository(),
        })(event as IMarkMyNotificationReadEvent),
    {
        auth: {
            allowInactive: true,
        },
    }
)

export const mePermissions = lambdaHandler(
    async (event) => {
        const deps = {
            userRepository: userRepository(),
        };

        return mePermissionsHandler()(
            event as IMePermissionsEvent
        );
    },
    {
        auth: {},
    }
);

export const createMyProfileImageUpload = lambdaHandler(
    async (event) =>
        createMyProfileImageUploadHandler({
            userRepository: userRepository(),
        })(event as ICreateMyProfileImageUploadEvent),
    {
        auth: {},
        requestValidator: createMyProfileImageUploadValidator,
    }
)

export const updateMyProfileImage = lambdaHandler(
    async (event) =>
        updateMyProfileImageHandler({
            userRepository: userRepository(),
        })(event as IUpdateMyProfileImageEvent),
    {
        auth: {},
        requestValidator: updateMyProfileImageValidator,
    }
)
