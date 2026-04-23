import { lambdaHandler } from "@/core/middy"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import {
    listUsersHandler,
    getUserHandler,
    updateUserSupplierHandler,
} from "./handlers"

import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IGetUserEvent, IUpdateUserSupplierEvent } from "@/functions/AdminApi/types/users"
import {
    listUsersResponseValidator,
    getUserResponseValidator,
    idValidator,
    updateUserSupplierValidator,
    updateUserSupplierResponseValidator,
} from "@/functions/AdminApi/validators/users"

export const listUsers = lambdaHandler(
    async (event) =>
        listUsersHandler({
            userRepository: userRepository(),
        })(event as IAPIGatewayProxyEventWithUser),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        responseValidator: listUsersResponseValidator,
    },
)

export const getUser = lambdaHandler(
    async (event) => {
        return getUserHandler({
            userRepository: userRepository(),
        })(event as IGetUserEvent)
    },
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: idValidator,
        responseValidator: getUserResponseValidator,
    }
)

export const updateUserSupplier = lambdaHandler(
    async (event) =>
        updateUserSupplierHandler({
            userRepository: userRepository(),
            supplierRepository: supplierRepository(),
        })(event as IUpdateUserSupplierEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: updateUserSupplierValidator,
        responseValidator: updateUserSupplierResponseValidator,
    }
)
