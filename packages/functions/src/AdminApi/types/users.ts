import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

export interface IUsersDependencies {
    userRepository: IPrismaUserRepository
}

export type IGetUserEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>