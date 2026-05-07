"use client"

import { signIn } from "next-auth/react"
import { useMutation } from "@tanstack/react-query"
import { AuthApiClientError } from "@/features/auth/api/types"

type SignInParams = {
    email: string
    password: string
    callbackUrl: string
}

export function useAuthSignIn() {
    return useMutation({
        mutationFn: async ({ email, password, callbackUrl }: SignInParams) => {
            const result = await signIn("cognito-credentials", {
                redirect: false,
                email,
                password,
                callbackUrl,
            })

            if (!result) {
                throw new AuthApiClientError({
                    code: "UNKNOWN_AUTH_ERROR",
                    message: "Giriş işlemi tamamlanamadı.",
                }, 500)
            }

            if (result.error) {
                throw new AuthApiClientError({
                    code: result.error as AuthApiClientError["code"],
                    message: result.error,
                }, result.status ?? 400)
            }

            return result
        },
    })
}
