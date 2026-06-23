import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import type { IPrismaUserRepository, UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import type { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"

export const ALL_USER_GROUPS = ["owner", "admin", "user", "supplier", "purchasing", "sales", "sales_director", "customer", "content_editor"] as const
export const BUSINESS_USER_GROUPS = ["user", "supplier", "purchasing", "sales", "sales_director", "customer", "content_editor"] as const
export const PRIVILEGED_USER_GROUPS = ["admin", "owner"] as const

export type UserGroup = (typeof ALL_USER_GROUPS)[number]

export type UserAccessUpdateEventDetail = {
    userId: string
    cognitoSub: string
    email: string
    previousGroups: string[]
    nextGroups: string[]
    previousAccessStatus: UserAccessStatus
    nextAccessStatus: UserAccessStatus
    reason?: string | null
    changedByUserId: string
    changedByEmail: string
    changedAt: string
}

export interface IUserAccessUpdateDependencies {
    cognitoRepository: ICognitoUserRepository
    userRepository: IPrismaUserRepository
    supplierRepository?: IPrismaSupplierRepository
    customerRepository?: IPrismaCustomerRepository
    userPoolId: string
    publishEvent: (detail: UserAccessUpdateEventDetail) => Promise<void>
}
