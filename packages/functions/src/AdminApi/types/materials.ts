import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"

export interface IMaterialDependencies {
    materialRepository: IPrismaMaterialRepository
}

export interface ICreateMaterialBody {
    name: string
    code?: string
}

export type ICreateMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateMaterialBody>

export type IUpdateMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateMaterialBody>,
        { id: string }
    >

export type IGetMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListMaterialsEvent =
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
