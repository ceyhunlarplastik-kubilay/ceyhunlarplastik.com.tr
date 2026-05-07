import type { AuthApiResponse } from "@/features/auth/api/types"
import { AuthApiClientError } from "@/features/auth/api/types"

export async function postAuthRequest<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    const payload = await response.json() as AuthApiResponse<TResponse>

    if (!response.ok || payload.success === false) {
        const error = payload.success === false
            ? payload.error
            : {
                code: "UNKNOWN_AUTH_ERROR" as const,
                message: "Kimlik doğrulama isteği tamamlanamadı.",
            }

        throw new AuthApiClientError(error, response.status)
    }

    return payload.data
}
