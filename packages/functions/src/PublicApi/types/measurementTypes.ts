import { IAPIGatewayProxyEventWithUserGeneric, IAPIGatewayPaginationQuery } from "@/core/helpers/utils/api/types"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

export interface IMeasurementTypeDependencies {
    measurementTypeRepository: IPrismaMeasurementTypeRepository
}

export type IListMeasurementTypesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    IAPIGatewayPaginationQuery & { locale?: string }
>

export type IGetMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string },
    { locale?: string }
>
