import { IAPIGatewayProxyEventWithUserGeneric, IAPIGatewayPaginationQuery } from "@/core/helpers/utils/api/types"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

export interface IMeasurementTypeDependencies {
    measurementTypeRepository: IPrismaMeasurementTypeRepository
}

export type IListMeasurementTypesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    IAPIGatewayPaginationQuery
>

export type IGetMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string },
    {}
>
