import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductMeasurementRequirementRepository } from "@/core/helpers/prisma/productMeasurementRequirements/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"

export interface IProductMeasurementRequirementDependencies {
    productMeasurementRequirementRepository: IPrismaProductMeasurementRequirementRepository
    productRepository: IPrismaProductRepository
}

export interface IMeasurementRequirementInputBody {
    id?: string
    measurementTypeId: string
    label: string
    unit?: string
    isRequired?: boolean
    sortPriority?: number
    displayOrder?: number
    translations?: Array<{ locale: string; label: string }>
}

export type IListMeasurementRequirementsEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IReplaceMeasurementRequirementsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        { requirements: IMeasurementRequirementInputBody[] },
        { id: string }
    >
