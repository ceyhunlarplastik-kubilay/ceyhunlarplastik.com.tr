import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import {
    createUserHandler,
    getUserHandler,
} from "@/functions/PublicApi/functions/users/handlers"

import {
    ICreateUserDependencies,
    ICreateUserEvent,
    IGetUserDependencies,
    IGetUserEvent,
} from "@/functions/PublicApi/types/users"

import { createUserValidator } from "@/functions/PublicApi/validators/users"

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
    }
)

export const createUser = lambdaHandler(
    async (event) => {
        const deps: ICreateUserDependencies = {
            userRepository: userRepository(),
        }

        return createUserHandler(deps)(
            event as ICreateUserEvent
        )
    },
    {
        auth: false,
        requestValidator: createUserValidator,
    }
)

