import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { listUsersHandler } from "./handlers"

import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types";

export const listUsers = lambdaHandler(
    async (event) => 
        listUsersHandler({
            userRepository: userRepository(),
        })(event as IAPIGatewayProxyEventWithUser),
    {
        auth: { requiredPermissionGroups: ["admin"] },
    },
)
