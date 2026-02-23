import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { getUserHandler, listUsersHandler } from "@/functions/PublicApi/functions/users/handlers"
import { APIGatewayProxyEventV2 } from 'aws-lambda'
import {
    IGetUserDependencies,
    IGetUserEvent,
    IListUsersDependencies,
} from "@/functions/PublicApi/types/users"

import { idValidator, getUserResponseValidator, listUsersResponseValidator } from "@/functions/PublicApi/validators/users"

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
        auth: false,
        requestValidator: idValidator,
        responseValidator: getUserResponseValidator
    }
)

export const listUsers = lambdaHandler(
    async (event) => {
        const deps: IListUsersDependencies = {
            userRepository: userRepository(),
        }

        return listUsersHandler(deps)(
            event as APIGatewayProxyEventV2
        )
    },
    {
        auth: false,
        responseValidator: listUsersResponseValidator
    }
)
