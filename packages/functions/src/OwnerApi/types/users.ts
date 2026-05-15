import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import type { UserAccessUpdateEventDetail } from "@/core/helpers/userAccess/types"

enum UserGroups {
    USER = "user",
    ADMIN = "admin",
    OWNER = "owner",
    SUPPLIER = "supplier",
    PURCHASING = "purchasing",
    SALES = "sales",
    CUSTOMER = "customer",
}

export interface IAddUserToGroupBody {
    group: UserGroups
    accessStatus?: UserAccessStatus
    supplierId?: string | null
    customerId?: string | null
    reason?: string | null
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
    customerRepository: IPrismaCustomerRepository
    userPoolId: string
    publishEvent: (detail: UserAccessUpdateEventDetail) => Promise<void>
}
