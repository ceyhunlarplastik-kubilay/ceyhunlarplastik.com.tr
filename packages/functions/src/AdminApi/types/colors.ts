import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export type IGetColorEvent = IAPIGatewayProxyEventWithUser

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
    IAPIGatewayProxyEventWithUser<ICreateColorBody>

export interface IListColorsQueryParams {
    page?: string
    limit?: string
    search?: string
    sort?: "code" | "name" | "createdAt"
    order?: "asc" | "desc"
}


export type IListColorsEvent =
    IAPIGatewayProxyEventWithUser & {
        queryStringParameters?: IListColorsQueryParams
    }

export type IDeleteColorEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
    }

export type IUpdateColorEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string 
        }
        body: Partial<{
            system: ColorSystem
            code: string
            name: string
            hex: string
        }>
    }


export interface IGetColorDependencies {
    colorRepository: IPrismaColorRepository
}

export interface IListColorsDependencies extends IGetColorDependencies { }

export interface ICreateColorDependencies extends IGetColorDependencies { }

export interface IDeleteColorDependencies extends IGetColorDependencies { }

export interface IUpdateColorDependencies extends IGetColorDependencies { }