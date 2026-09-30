import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import type { IPrismaUserRepository, UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import type { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"

// Grup listesi saf `groups.ts`'te (frontend de oradan okur); mevcut import'lar
// kırılmasın diye buradan da yeniden dışa aktarılır.
export {
    ALL_USER_GROUPS,
    BUSINESS_USER_GROUPS,
    PRIVILEGED_USER_GROUPS,
    type UserGroup,
} from "./groups"

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
