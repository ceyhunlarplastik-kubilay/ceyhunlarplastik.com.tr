import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface IProductVariantDependencies {
    productVariantRepository: IPrismaProductVariantRepository
    productRepository: IPrismaProductRepository
    materialRepository: IPrismaMaterialRepository
    supplierRepository: IPrismaSupplierRepository
}

export type IGetProductVariantEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListProductVariantsEvent =
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
