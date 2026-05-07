"use client"

import { useMutation } from "@tanstack/react-query"
import { signUp } from "@/features/auth/api/signUp"

export function useAuthSignUp() {
    return useMutation({
        mutationFn: signUp,
    })
}
