"use client"

import { useMutation } from "@tanstack/react-query"
import { resendConfirmation } from "@/features/auth/api/resendConfirmation"

export function useResendConfirmation() {
    return useMutation({
        mutationFn: resendConfirmation,
    })
}
