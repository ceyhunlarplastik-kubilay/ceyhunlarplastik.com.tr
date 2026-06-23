"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerInvitation } from "@/features/customerInvitations/api/getCustomerInvitation"

export function useCustomerInvitation(token: string) {
    return useQuery({
        queryKey: ["customer-invitation", token],
        queryFn: () => getCustomerInvitation(token),
        enabled: Boolean(token.trim()),
        retry: false,
    })
}
