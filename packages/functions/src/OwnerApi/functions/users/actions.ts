import { Resource } from "sst";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { lambdaHandler } from "@/core/middy"
import { cognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { updateUserGroupsHandler } from "./handlers"
import { addUserToGroupValidator } from "@/functions/OwnerApi/validators/users"

import type { IUpdateUserGroupsEvent } from "@/functions/OwnerApi/types/users"

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

export const updateUserGroups = lambdaHandler(
    async (event) =>
        updateUserGroupsHandler({
            cognitoRepository: cognitoUserRepository(),
            userRepository: userRepository(),
            supplierRepository: supplierRepository(),
            customerRepository: customerRepository(),
            userPoolId: Resource.CeyhunlarUserPool.id,
            publishEvent: publishUserAccessUpdated,
        })(event as IUpdateUserGroupsEvent),
    {
        auth: { requiredPermissionGroups: ["owner"] },
        requestValidator: addUserToGroupValidator,
    },
)
