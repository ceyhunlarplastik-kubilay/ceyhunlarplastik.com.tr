import { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { IUserInvitationRepository } from "@/core/helpers/prisma/userInvitations/repository"
import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

export interface ICustomerInvitationDependencies {
    userInvitationRepository: IUserInvitationRepository
    userRepository?: IPrismaUserRepository
    cognitoRepository?: ICognitoUserRepository
    userPoolId?: string
    /** Davet kabul edilince LEAD→CUSTOMER otomatik dönüşümü için. */
    customerRepository?: IPrismaCustomerRepository
}

export type IGetCustomerInvitationEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { token: string }
>

export type IAcceptCustomerInvitationEvent = IAPIGatewayProxyEventWithUserGeneric<{
    token: string
    password: string
}>
