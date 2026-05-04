import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface IProductVariantSupplierDependencies {
    productVariantSupplierRepository: IPrismaProductVariantSupplierRepository
    productVariantRepository: IPrismaProductVariantRepository
    supplierRepository: IPrismaSupplierRepository
}

export interface ICreateProductVariantSupplierBody {
    variantId: string
    supplierId: string
    isActive?: boolean
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
    paymentTermDays?: number
    supplierVariantCode?: string
    supplierNote?: string
    minOrderQty?: number
    stockQty?: number
    currency?: string
}

export type ICreateProductVariantSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductVariantSupplierBody>

export type IUpdateProductVariantSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductVariantSupplierBody>,
        { id: string }
    >

export type IGetProductVariantSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteProductVariantSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListProductVariantSuppliersEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            variantId?: string
            supplierId?: string
            productId?: string
            categoryId?: string
            sort?: string
            order?: "asc" | "desc"
        }
    >

export type IListSupplierProductsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            supplierId?: string
            categoryId?: string
            search?: string
            page?: string
            limit?: string
            sort?: string
            order?: "asc" | "desc"
        }
    >

export type IBulkUpdateProductVariantSupplierPricingEvent =
    IAPIGatewayProxyEventWithUserGeneric<{
        productId: string
        supplierId?: string
        operationalCostRate?: number
        profitRate?: number
    }>
