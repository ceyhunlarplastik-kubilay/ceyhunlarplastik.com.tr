"use client"

import { useMutation } from "@tanstack/react-query"
import { acceptCustomerInvitation } from "@/features/customerInvitations/api/acceptCustomerInvitation"

export function useAcceptCustomerInvitation() {
    return useMutation({
        mutationFn: acceptCustomerInvitation,
    })
}
