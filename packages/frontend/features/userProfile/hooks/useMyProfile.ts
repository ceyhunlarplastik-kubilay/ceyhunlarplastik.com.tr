"use client"

import { useQuery } from "@tanstack/react-query"
import { getMyAccess } from "@/features/auth/api/getMyAccess"

type Options = {
    enabled?: boolean
}

export function useMyProfile({ enabled = true }: Options = {}) {
    return useQuery({
        queryKey: ["my-access"],
        queryFn: getMyAccess,
        enabled,
        staleTime: 30_000,
    })
}
