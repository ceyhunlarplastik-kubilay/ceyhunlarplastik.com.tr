import { postAuthRequest } from "@/features/auth/api/request"

export type ConfirmForgotPasswordPayload = {
    email: string
    code: string
    password: string
}

export type ConfirmForgotPasswordResponse = {
    email: string
}

export function confirmForgotPassword(payload: ConfirmForgotPasswordPayload) {
    return postAuthRequest<ConfirmForgotPasswordResponse, ConfirmForgotPasswordPayload>("/api/auth/cognito/confirm-forgot-password", payload)
}
