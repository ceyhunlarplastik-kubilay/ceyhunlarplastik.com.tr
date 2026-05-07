import { postAuthRequest } from "@/features/auth/api/request"

export type LogoutResponse = {
    revoked: boolean
}

export function logout() {
    return postAuthRequest<LogoutResponse, Record<string, never>>("/api/auth/cognito/logout", {})
}
