import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

enum UserGroups {
    USER = "user",
    ADMIN = "admin",
    OWNER = "owner",
    SUPPLIER = "supplier",
    PURCHASING = "purchasing",
    SALES = "sales",
}

export interface IAddUserToGroupBody {
    group: UserGroups
    supplierId?: string | null
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
    supplierRepository: IPrismaSupplierRepository
    userPoolId: string
}
