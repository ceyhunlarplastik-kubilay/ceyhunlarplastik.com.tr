import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

export interface IUsersDependencies {
    userRepository: IPrismaUserRepository
    supplierRepository?: IPrismaSupplierRepository
}

export type IGetUserEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IUpdateUserSupplierBody = {
    supplierId?: string | null
}

export type IUpdateUserSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<IUpdateUserSupplierBody, { id: string }>
