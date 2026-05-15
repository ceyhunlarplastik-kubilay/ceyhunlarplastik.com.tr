import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"
import { Resource } from "sst"
import { lambdaHandler } from "@/core/middy"
import { cognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import {
    listUsersHandler,
    getUserHandler,
    updateUserSupplierHandler,
    updateUserRoleHandler,
} from "./handlers"

import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IGetUserEvent, IUpdateUserRoleEvent, IUpdateUserSupplierEvent } from "@/functions/AdminApi/types/users"
import {
    listUsersResponseValidator,
    getUserResponseValidator,
    idValidator,
    updateUserRoleResponseValidator,
    updateUserRoleValidator,
    updateUserSupplierValidator,
    updateUserSupplierResponseValidator,
} from "@/functions/AdminApi/validators/users"

const eventBridge = new EventBridgeClient({})

async function publishUserAccessUpdated(detail: Record<string, unknown>) {
    await eventBridge.send(new PutEventsCommand({
        Entries: [
            {
                EventBusName: Resource.UserAccessBus.name,
                Source: "ceyhunlar.user-access",
                DetailType: "user.access.updated",
                Detail: JSON.stringify(detail),
            },
        ],
    }))
}

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
            customerRepository: customerRepository(),
        })(event as IUpdateUserSupplierEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: updateUserSupplierValidator,
        responseValidator: updateUserSupplierResponseValidator,
    }
)

export const updateUserAssignment = updateUserSupplier

export const updateUserRole = lambdaHandler(
    async (event) =>
        updateUserRoleHandler({
            cognitoRepository: cognitoUserRepository(),
            userRepository: userRepository(),
            supplierRepository: supplierRepository(),
            customerRepository: customerRepository(),
            userPoolId: Resource.CeyhunlarUserPool.id,
            publishEvent: publishUserAccessUpdated,
        })(event as IUpdateUserRoleEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: updateUserRoleValidator,
        responseValidator: updateUserRoleResponseValidator,
    }
)
