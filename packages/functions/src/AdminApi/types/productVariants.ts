import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"

export interface IProductVariantDependencies {
    productVariantRepository: IPrismaProductVariantRepository
    productRepository: IPrismaProductRepository
    materialRepository: IPrismaMaterialRepository
    supplierRepository: IPrismaSupplierRepository
    measurementTypeRepository: IPrismaMeasurementTypeRepository
    colorRepository: IPrismaColorRepository
}

export interface IVariantSupplierInput {
    id: string
    isActive?: boolean
}

export interface ICreateProductVariantBody {
    productId: string
    variantIndex: number
    suppliers: IVariantSupplierInput[]
    versionCode: string
    supplierCode: string
    name: string
    colorId?: string
    materialIds?: string[]
    measurements?: {
        measurementTypeId: string
        value: number
        label: string
    }[]
}

export type ICreateProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductVariantBody>

export type IUpdateProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductVariantBody>,
        { id: string }
    >

export type IGetProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

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
            productId?: string
        }
    >
