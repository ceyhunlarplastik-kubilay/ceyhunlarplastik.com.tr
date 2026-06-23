import { IAPIGatewayProxyEventWithUser, IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IUserNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"
import type { IAPIGatewayPaginationQuery } from "@/core/helpers/utils/api/types"
import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"

export type IListUsersEvent = IAPIGatewayProxyEventWithUserGeneric<
  {},
  {},
  IAPIGatewayPaginationQuery & {
    accessStatus?: UserAccessStatus
  }
>;

export type IGetUserEvent = IAPIGatewayProxyEventWithUser;

export type IGetMeEvent = IAPIGatewayProxyEventWithUser;
export type IUpdateMyProfileEvent = IAPIGatewayProxyEventWithUser<{
  identifier?: string
  firstName?: string
  lastName?: string
  phone?: string | null
  customerContactTitle?: string | null
  customerContactDepartment?: string | null
}>;
export type ICreateMyProfileImageUploadEvent = IAPIGatewayProxyEventWithUser<{
  fileName: string
  contentType: string
}>;
export type IUpdateMyProfileImageEvent = IAPIGatewayProxyEventWithUser<{
  imageKey: string | null
}>;

export type IMePermissionsEvent = IAPIGatewayProxyEventWithUser;
export type IGetMyAccessEvent = IAPIGatewayProxyEventWithUser;
export type IListMyNotificationsEvent = IAPIGatewayProxyEventWithUser;
export type IMarkMyNotificationReadEvent = IAPIGatewayProxyEventWithUser<unknown> & {
  pathParameters: {
    id: string
  }
};

export interface IListUsersDependencies {
  userRepository: IPrismaUserRepository
}

export interface IGetUserDependencies {
  userRepository: IPrismaUserRepository
}

export interface IGetMeDependencies {
  userRepository: IPrismaUserRepository;
}

export interface IMyProfileImageDependencies {
  userRepository: IPrismaUserRepository;
}

export interface IMyProfileDependencies {
  userRepository: IPrismaUserRepository;
  cognitoRepository: ICognitoUserRepository;
  userPoolId: string;
}

export interface IGetMyAccessDependencies {
  userRepository: IPrismaUserRepository;
}

export interface IUserNotificationDependencies {
  userNotificationRepository: IUserNotificationRepository;
}
