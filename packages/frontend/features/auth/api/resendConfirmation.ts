import { postAuthRequest } from "@/features/auth/api/request"

export type ResendConfirmationPayload = {
    email: string
}

export type ResendConfirmationResponse = {
    email: string
}

export function resendConfirmation(payload: ResendConfirmationPayload) {
    return postAuthRequest<ResendConfirmationResponse, ResendConfirmationPayload>("/api/auth/cognito/resend-confirmation", payload)
}
