import type { AuthErrorCode } from "@/features/auth/server/errors"

export type AuthApiError = {
    code: AuthErrorCode
    message: string
}

export type AuthApiErrorResponse = {
    success: false
    error: AuthApiError
}

export type AuthApiSuccessResponse<T> = {
    success: true
    data: T
}

export type AuthApiResponse<T> = AuthApiSuccessResponse<T> | AuthApiErrorResponse

export class AuthApiClientError extends Error {
    code: AuthErrorCode
    statusCode: number

    constructor(error: AuthApiError, statusCode: number) {
        super(error.message)
        this.name = "AuthApiClientError"
        this.code = error.code
        this.statusCode = statusCode
    }
}
