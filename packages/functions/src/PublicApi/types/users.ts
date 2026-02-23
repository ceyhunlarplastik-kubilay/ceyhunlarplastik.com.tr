import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"

export type IGetUserEvent =
  IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export interface IGetUserDependencies {
  userRepository: IPrismaUserRepository
}
export interface IListUsersDependencies extends IGetUserDependencies { }
