import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface ISupplierDependencies {
    supplierRepository: IPrismaSupplierRepository
}

export interface ICreateSupplierDependencies extends ISupplierDependencies { }
export interface IListSuppliersDependencies extends ISupplierDependencies { }
export interface IGetSupplierDependencies extends ISupplierDependencies { }
export interface IUpdateSupplierDependencies extends ISupplierDependencies { }
export interface IDeleteSupplierDependencies extends ISupplierDependencies { }

export interface ICreateSupplierBody {
    name: string
    isActive: boolean
}

export type ICreateSupplierEvent =
    IAPIGatewayProxyEventWithUser<ICreateSupplierBody>

export interface IListSuppliersEvent extends IAPIGatewayProxyEventWithUser { }

export type IUpdateSupplierEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
        body: Partial<{
            name?: string
            isActive?: boolean
        }>
    }

export interface IGetSupplierEvent extends IAPIGatewayProxyEventWithUser { }
export interface IDeleteSupplierEvent extends IAPIGatewayProxyEventWithUser { }
