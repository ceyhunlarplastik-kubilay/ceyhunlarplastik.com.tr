import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductMeasurementRepository } from "@/core/helpers/prisma/productMeasurements/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

export interface IProductMeasurementDependencies {
    productMeasurementRepository: IPrismaProductMeasurementRepository
    productVariantRepository: IPrismaProductVariantRepository
    measurementTypeRepository: IPrismaMeasurementTypeRepository
}

export interface ICreateProductMeasurementBody {
    variantId: string
    measurementTypeId: string
    value: number
    label?: string
}

export type ICreateProductMeasurementEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductMeasurementBody>

export type IUpdateProductMeasurementEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductMeasurementBody>,
        { id: string }
    >

export type IGetProductMeasurementEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteProductMeasurementEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListProductMeasurementsEvent =
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
