import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface ISupplierVariantPriceDependencies {
    productVariantSupplierRepository: IPrismaProductVariantSupplierRepository
    supplierRepository: IPrismaSupplierRepository
}

export type IListSupplierVariantPricesEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            variantId?: string
            productId?: string
            categoryId?: string
            supplierId?: string
        }
    >

export type IListSupplierProductsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            categoryId?: string
            supplierId?: string
        }
    >

export type IGetSupplierProfileEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, {}, {}>

export type IUpdateSupplierProfileEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {
            name?: string
            contactName?: string
            phone?: string
            address?: string
            taxNumber?: string
            defaultPaymentTermDays?: number
        },
        {},
        {}
    >

export type IUpdateSupplierVariantPriceEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {
            price: number
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
        },
        { id: string }
    >
