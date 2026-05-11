import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

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
