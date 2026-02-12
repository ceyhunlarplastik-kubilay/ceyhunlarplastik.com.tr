import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"

enum UserGroups {
    USER = "user",
    ADMIN = "admin",
    OWNER = "owner",
}

export interface IAddUserToGroupBody {
    group: UserGroups
}

export type IUpdateUserGroupsEvent =
    IAPIGatewayProxyEventWithUser<IAddUserToGroupBody> & {
        pathParameters: {
            id: string
        }
    }

export interface IUpdateUserGroupsDependencies {
    cognitoRepository: ICognitoUserRepository
    userRepository: IPrismaUserRepository
    userPoolId: string
}
