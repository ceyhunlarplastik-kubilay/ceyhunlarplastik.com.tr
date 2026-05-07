import { postAuthRequest } from "@/features/auth/api/request"

export type ConfirmSignUpPayload = {
    email: string
    code: string
}

export type ConfirmSignUpResponse = {
    email: string
}

export function confirmSignUp(payload: ConfirmSignUpPayload) {
    return postAuthRequest<ConfirmSignUpResponse, ConfirmSignUpPayload>("/api/auth/cognito/confirm-sign-up", payload)
}
