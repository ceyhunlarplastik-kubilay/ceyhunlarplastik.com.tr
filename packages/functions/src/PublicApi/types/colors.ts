import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export interface IColorDependencies {
    colorRepository: IPrismaColorRepository
}
export type IGetColorEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListColorsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: "code" | "name" | "createdAt"
            order?: "asc" | "desc"
        }
    >