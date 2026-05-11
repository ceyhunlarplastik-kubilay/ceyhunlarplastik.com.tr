import { Resource } from "sst";
import { lambdaHandler } from "@/core/middy"
import { cognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { updateUserGroupsHandler } from "./handlers"
import { addUserToGroupValidator } from "@/functions/OwnerApi/validators/users"

import type { IUpdateUserGroupsEvent } from "@/functions/OwnerApi/types/users"

export const updateUserGroups = lambdaHandler(
    async (event) =>
        updateUserGroupsHandler({
            cognitoRepository: cognitoUserRepository(),
            userRepository: userRepository(),
            supplierRepository: supplierRepository(),
            customerRepository: customerRepository(),
            userPoolId: Resource.CeyhunlarUserPool.id,
        })(event as IUpdateUserGroupsEvent),
    {
        auth: { requiredPermissionGroups: ["owner"] },
        requestValidator: addUserToGroupValidator,
    },
)
