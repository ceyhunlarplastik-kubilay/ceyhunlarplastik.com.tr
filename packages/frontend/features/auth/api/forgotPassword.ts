import { postAuthRequest } from "@/features/auth/api/request"

export type ForgotPasswordPayload = {
    email: string
}

export type ForgotPasswordResponse = {
    email: string
}

export function forgotPassword(payload: ForgotPasswordPayload) {
    return postAuthRequest<ForgotPasswordResponse, ForgotPasswordPayload>("/api/auth/cognito/forgot-password", payload)
}
