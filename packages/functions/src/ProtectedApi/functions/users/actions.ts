import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { listUsersHandler, getUserHandler, getMeHandler, mePermissionsHandler } from "@/functions/ProtectedApi/functions/users/handlers"
import { IListUsersDependencies, IGetUserDependencies, IListUsersEvent, IGetUserEvent, IMePermissionsEvent } from "@/functions/ProtectedApi/types/users"

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
        auth: {
            requiredPermissionGroups: ["user"],
        },
    }
);

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
        auth: {
            requiredPermissionGroups: ["user"],
        },
    }
);
