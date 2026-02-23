import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export type IGetColorEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export enum ColorSystem {
    RAL = "RAL",
    PANTONE = "PANTONE",
    NCS = "NCS",
    CUSTOM = "CUSTOM",
}

export interface ICreateColorBody {
    system?: ColorSystem
    code: string
    name: string
    hex: string
}

export type ICreateColorEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateColorBody>

export type IListColorsEvent =
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

export type IDeleteColorEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IUpdateColorEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateColorBody>,
        { id: string }
    >

export interface IColorDependencies {
    colorRepository: IPrismaColorRepository
}