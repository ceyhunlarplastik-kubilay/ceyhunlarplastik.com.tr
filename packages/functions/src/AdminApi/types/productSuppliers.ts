import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaProductSupplierRepository } from "@/core/helpers/prisma/productSuppliers/repository"

export interface IProductSupplierDependencies {
    productSupplierRepository: IPrismaProductSupplierRepository
}

export interface ICreateProductSupplierDependencies extends IProductSupplierDependencies {}
export interface IGetProductSupplierDependencies extends IProductSupplierDependencies {}
export interface IListProductSuppliersDependencies extends IProductSupplierDependencies {}
export interface IUpdateProductSupplierDependencies extends IProductSupplierDependencies {}
export interface IDeleteProductSupplierDependencies extends IProductSupplierDependencies {}

export interface ICreateProductSupplierBody {
    productId: string
    supplierId: string
    catalogCode: string
}

export type ICreateProductSupplierEvent =
    IAPIGatewayProxyEventWithUser<ICreateProductSupplierBody>

export type IUpdateProductSupplierEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: { id: string }
        body: Partial<{
            catalogCode: string
        }>
    }

export interface IListProductSuppliersEvent extends IAPIGatewayProxyEventWithUser { }
export interface IGetProductSupplierEvent extends IAPIGatewayProxyEventWithUser { }
export interface IDeleteProductSupplierEvent extends IAPIGatewayProxyEventWithUser { }
