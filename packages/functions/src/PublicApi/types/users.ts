import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"

export type IGetUserEvent = IAPIGatewayProxyEventWithUser

export interface ICreateUserBody {
  first_name: string
  last_name?: string
  email: string
}

export type ICreateUserEvent =
  IAPIGatewayProxyEventWithUser<ICreateUserBody>

export interface IGetUserDependencies {
  userRepository: IPrismaUserRepository
}

export interface ICreateUserDependencies extends IGetUserDependencies { }
