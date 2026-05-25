import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import type { UserAccessUpdateEventDetail } from "@/core/helpers/userAccess/types"

export interface IUsersDependencies {
    userRepository: IPrismaUserRepository
    supplierRepository?: IPrismaSupplierRepository
    customerRepository?: IPrismaCustomerRepository
}

export type IGetUserEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IUpdateUserSupplierBody = {
    supplierId?: string | null
    customerId?: string | null
    assignedSupplierIds?: string[]
    assignedCustomerIds?: string[]
}

export type IUpdateUserSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<IUpdateUserSupplierBody, { id: string }>

export type IUpdateUserRoleBody = {
    group: "owner" | "admin" | "user" | "supplier" | "purchasing" | "sales" | "sales_director" | "customer"
    accessStatus?: UserAccessStatus
    supplierId?: string | null
    customerId?: string | null
    reason?: string | null
}

export type IUpdateUserRoleEvent =
    IAPIGatewayProxyEventWithUserGeneric<IUpdateUserRoleBody, { id: string }>

export type IUpdateUserProfileBody = {
    email?: string
    identifier?: string
    firstName?: string
    lastName?: string
    phone?: string | null
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact?: boolean
}

export type IUpdateUserProfileEvent =
    IAPIGatewayProxyEventWithUserGeneric<IUpdateUserProfileBody, { id: string }>

export interface IUpdateUserRoleDependencies extends IUsersDependencies {
    cognitoRepository: ICognitoUserRepository
    userPoolId: string
    publishEvent: (detail: UserAccessUpdateEventDetail) => Promise<void>
}
