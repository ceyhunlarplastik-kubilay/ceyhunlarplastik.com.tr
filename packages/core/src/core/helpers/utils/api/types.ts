import { StartExecutionCommandOutput } from '@aws-sdk/client-sfn'
import {
  APIGatewayEventRequestContextJWTAuthorizer,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2,
} from 'aws-lambda'

/* // Cognito ID Token tipleri
export interface ICognitoIdTokenDecoded {
  sub: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  phone_number_verified?: boolean
  given_name?: string
  family_name?: string
  name?: string
  preferred_username?: string
  picture?: string
  'cognito:username'?: string
  'cognito:groups'?: string[]
  groups?: string[]
  aud?: string
  iss?: string
  exp?: number
  iat?: number
  auth_time?: number
  jti?: string
  origin_jti?: string
} */

export interface ICognitoIdTokenDecoded {
  sub: string
  email?: string
  'cognito:groups'?: string[] | string;
  aud?: string
  iss?: string
  exp?: number
}


// Authorizer + Claims tipi
/* export interface IAPIGatewayEventRequestContextJWTAuthorizerWithClaims
  extends Omit<APIGatewayEventRequestContextJWTAuthorizer, 'jwt'> {
  jwt?: {
    claims?: ICognitoIdTokenDecoded
    scopes?: string[]
  }
} */
export interface IAPIGatewayEventRequestContextJWTAuthorizerWithClaims
  extends Omit<APIGatewayEventRequestContextJWTAuthorizer, 'jwt'> {
  jwt?: {
    claims?: ICognitoIdTokenDecoded
    scopes?: string[]
  }
}

// Kullanıcı bilgisi tipi
export interface IAuthenticatedUser {
  id: string
  identifier: string
  email: string
  groups: string[]

  // ✅ derived flags
  isOwner: boolean
  isAdmin: boolean
}

// Lambda event tipi (hem authenticated hem anonymous destekler)
export interface IAPIGatewayProxyEventWithUser<TBody = object>
  extends Omit<APIGatewayProxyEventV2, 'requestContext' | 'body' | 'user'> {
  body?: TBody
  requestContext: APIGatewayEventRequestContextV2 & {
    authorizer?: IAPIGatewayEventRequestContextJWTAuthorizerWithClaims
  }
  user?: IAuthenticatedUser
}

export interface IApiResponseInput<TPayload> {
  statusCode: number
  payload: TPayload
}

export interface IApiResponse {
  statusCode: number
  headers: {
    'Content-Type': string
    'Access-Control-Allow-Origin': string
  }
  body: unknown
}

export interface IValidationErrorItem {
  field: string
  message: string
  keyword?: string
}

export interface IErrorResponseDetail {
  message: string
  cause?: string
  // errors?: string[]
  errors?: IValidationErrorItem[]
}

export interface IErrorResponseInput {
  statusCode: number
  detail: IErrorResponseDetail
}

export interface IStepFunctionExecutionResponse {
  execution: StartExecutionCommandOutput
  idempotencyId: string
}

export interface ICreateStepFunctionExecutionResponse extends IStepFunctionExecutionResponse {
  identity: {
    pk: string
    sk: string
  }
}