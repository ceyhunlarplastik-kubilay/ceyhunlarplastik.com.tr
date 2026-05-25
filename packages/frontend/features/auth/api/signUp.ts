import { postAuthRequest } from "@/features/auth/api/request"

export type SignUpPayload = {
    firstName: string
    lastName: string
    email: string
    password: string
}

export type SignUpResponse = {
    email: string
}

export function signUp(payload: SignUpPayload) {
    return postAuthRequest<SignUpResponse, SignUpPayload>("/api/auth/cognito/sign-up", payload)
}
