"use client"

import { useMutation } from "@tanstack/react-query"
import { confirmForgotPassword } from "@/features/auth/api/confirmForgotPassword"

export function useConfirmForgotPassword() {
    return useMutation({
        mutationFn: confirmForgotPassword,
    })
}
