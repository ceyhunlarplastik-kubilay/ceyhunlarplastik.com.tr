import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface ISupplierDependencies {
    supplierRepository: IPrismaSupplierRepository
}

export interface ICreateSupplierBody {
    name: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
    isActive: boolean
}

export type ICreateSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateSupplierBody>

export type IListSuppliersEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
        }
    >

export type IUpdateSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateSupplierBody>,
        { id: string }
    >

export type IGetSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>
