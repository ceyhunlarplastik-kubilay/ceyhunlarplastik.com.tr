import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IUserNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"

export type IListUsersEvent = IAPIGatewayProxyEventWithUser;

export type IGetUserEvent = IAPIGatewayProxyEventWithUser;

export type IGetMeEvent = IAPIGatewayProxyEventWithUser;
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

export interface IGetMyAccessDependencies {
  userRepository: IPrismaUserRepository;
}

export interface IUserNotificationDependencies {
  userNotificationRepository: IUserNotificationRepository;
}
