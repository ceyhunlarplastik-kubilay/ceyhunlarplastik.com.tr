"use client"

import { useMutation } from "@tanstack/react-query"
import { confirmSignUp } from "@/features/auth/api/confirmSignUp"

export function useConfirmSignUp() {
    return useMutation({
        mutationFn: confirmSignUp,
    })
}
