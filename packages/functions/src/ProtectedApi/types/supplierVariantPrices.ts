import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"

export interface ISupplierVariantPriceDependencies {
    productVariantSupplierRepository: IPrismaProductVariantSupplierRepository
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

export type IUpdateSupplierVariantPriceEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {
            price: number
            currency?: string
        },
        { id: string }
    >
