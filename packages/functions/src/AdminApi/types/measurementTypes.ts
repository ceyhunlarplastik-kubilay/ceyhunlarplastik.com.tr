import { IAPIGatewayProxyEventWithUserGeneric, IAPIGatewayPaginationQuery } from "@/core/helpers/utils/api/types"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

export interface IMeasurementTypeDependencies {
    measurementTypeRepository: IPrismaMeasurementTypeRepository
}

export interface ICreateMeasurementTypeDependencies extends IMeasurementTypeDependencies { }
export interface IListMeasurementTypesDependencies extends IMeasurementTypeDependencies { }
export interface IGetMeasurementTypeDependencies extends IMeasurementTypeDependencies { }
export interface IUpdateMeasurementTypeDependencies extends IMeasurementTypeDependencies { }
export interface IDeleteMeasurementTypeDependencies extends IMeasurementTypeDependencies { }

export interface ICreateMeasurementTypeBody {
    name: string
    code: "D" | "L" | "T" | "A" | "W" | "H"
    baseUnit: string
    displayOrder?: number
}

export type ICreateMeasurementTypeEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateMeasurementTypeBody>

export type IListMeasurementTypesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    IAPIGatewayPaginationQuery
>

export type IUpdateMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        name?: string
        code?: "D" | "L" | "T" | "A" | "W" | "H"
        baseUnit?: string
        displayOrder?: number
    }, {
        id: string
    }, {}
>

export type IGetMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string },
    {}
>
export interface IDeleteMeasurementTypeEvent extends IGetMeasurementTypeEvent { }
