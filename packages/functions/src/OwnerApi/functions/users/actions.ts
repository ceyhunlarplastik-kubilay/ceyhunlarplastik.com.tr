import { Resource } from "sst";
import { lambdaHandler } from "@/core/middy"
import { cognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { updateUserGroupsHandler } from "./handlers"
import { addUserToGroupValidator } from "@/functions/OwnerApi/validators/users"

import type { IUpdateUserGroupsEvent } from "@/functions/AdminApi/types/users"

export const updateUserGroups = lambdaHandler(
    async (event) => 
        updateUserGroupsHandler({
            cognitoRepository: cognitoUserRepository(),
            userRepository: userRepository(),
            userPoolId: Resource.CeyhunlarUserPool.id,
        })(event as IUpdateUserGroupsEvent),
    {
        auth: { requiredPermissionGroups: ["owner"] },
        requestValidator: addUserToGroupValidator,
    },
)
