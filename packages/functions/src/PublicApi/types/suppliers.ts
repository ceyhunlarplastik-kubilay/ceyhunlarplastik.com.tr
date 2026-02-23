import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface ISupplierDependencies {
    supplierRepository: IPrismaSupplierRepository
}

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

export type IGetSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>
