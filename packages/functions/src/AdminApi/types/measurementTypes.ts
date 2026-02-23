import { IAPIGatewayProxyEventWithUserGeneric, IAPIGatewayPaginationQuery } from "@/core/helpers/utils/api/types"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

export interface IMeasurementTypeDependencies {
    measurementTypeRepository: IPrismaMeasurementTypeRepository
}

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

/* export type IUpdateMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        name?: string
        code?: "D" | "L" | "T" | "A" | "W" | "H"
        baseUnit?: string
        displayOrder?: number
    }, {
        id: string
    }, {}
> */


export type IUpdateMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<ICreateMeasurementTypeBody>,
    { id: string }
>

export type IGetMeasurementTypeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string },
    {}
>
export interface IDeleteMeasurementTypeEvent extends IGetMeasurementTypeEvent { }
