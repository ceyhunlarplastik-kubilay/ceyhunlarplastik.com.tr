"use client"

import { useMutation } from "@tanstack/react-query"
import { forgotPassword } from "@/features/auth/api/forgotPassword"

export function useForgotPassword() {
    return useMutation({
        mutationFn: forgotPassword,
    })
}
