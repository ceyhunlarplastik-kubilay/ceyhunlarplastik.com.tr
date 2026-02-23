import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { listUsersHandler, getUserHandler } from "./handlers"

import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IGetUserEvent } from "@/functions/AdminApi/types/users"
import { listUsersResponseValidator, getUserResponseValidator, idValidator } from "@/functions/AdminApi/validators/users"

export const listUsers = lambdaHandler(
    async (event) =>
        listUsersHandler({
            userRepository: userRepository(),
        })(event as IAPIGatewayProxyEventWithUser),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listUsersResponseValidator,
    },
)

export const getUser = lambdaHandler(
    async (event) => {
        getUserHandler({
            userRepository: userRepository(),
        })(event as IGetUserEvent)
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: getUserResponseValidator,
    }
)
