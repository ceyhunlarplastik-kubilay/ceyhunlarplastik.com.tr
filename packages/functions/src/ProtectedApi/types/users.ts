import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"

export type IListUsersEvent = IAPIGatewayProxyEventWithUser;

export type IGetUserEvent = IAPIGatewayProxyEventWithUser;

export type IGetMeEvent = IAPIGatewayProxyEventWithUser;

export type IMePermissionsEvent = IAPIGatewayProxyEventWithUser;

export interface IListUsersDependencies {
  userRepository: IPrismaUserRepository
}

export interface IGetUserDependencies {
  userRepository: IPrismaUserRepository
}

export interface IGetMeDependencies {
  userRepository: IPrismaUserRepository;
}
