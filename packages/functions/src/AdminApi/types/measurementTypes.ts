import { IAPIGatewayProxyEventWithUserGeneric, IAPIGatewayPaginationQuery } from "@/core/helpers/utils/api/types"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import type { VariantDictionaryTranslationInput } from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

export interface IMeasurementTypeDependencies {
    measurementTypeRepository: IPrismaMeasurementTypeRepository
}

export interface ICreateMeasurementTypeBody {
    name: string
    code: "D" | "D1" | "D2" | "R" | "R1" | "R2" | "L" | "L1" | "L2" | "T" | "A" | "W" | "H" | "H1" | "H2" | "PT" | "M" | "R_L"
    baseUnit: string
    displayOrder?: number
    translations?: VariantDictionaryTranslationInput[]
}

export type ICreateMeasurementTypeEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateMeasurementTypeBody>

export type IListMeasurementTypesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    IAPIGatewayPaginationQuery & {
        code?: ICreateMeasurementTypeBody["code"]
        baseUnit?: string
    }
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
