import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductSupplierCodeRepository } from "@/core/helpers/prisma/productSupplierCodes/repository"

export interface IProductSupplierCodeDependencies {
    productSupplierCodeRepository: IPrismaProductSupplierCodeRepository
}

export type IListProductSupplierCodesEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateProductSupplierCodeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        supplierId: string
        /** Verilmezse sıradaki harf atanır. */
        code?: string
    },
    { id: string }
>

/** Harf (`code`) BİLİNÇLİ olarak alınmaz — değiştirilemez. */
export type IUpdateProductSupplierCodeEvent = IAPIGatewayProxyEventWithUserGeneric<
    { supplierId: string },
    { id: string; codeId: string }
>

export type IDeleteProductSupplierCodeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; codeId: string }
>
