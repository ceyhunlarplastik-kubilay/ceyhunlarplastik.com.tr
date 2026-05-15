"use client"

import { useQuery } from "@tanstack/react-query"
import { getMyAccess } from "@/features/auth/api/getMyAccess"

export function useMyAccess() {
    return useQuery({
        queryKey: ["my-access"],
        queryFn: getMyAccess,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    })
}
