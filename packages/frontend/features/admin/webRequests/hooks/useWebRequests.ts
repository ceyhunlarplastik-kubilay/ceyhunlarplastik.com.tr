"use client"

import { useQuery } from "@tanstack/react-query"
import { getWebRequests } from "@/features/admin/webRequests/api/getWebRequests"

type Params = {
    page: number
    limit: number
    search?: string
    status?: string
}

export function useWebRequests(params: Params) {
    return useQuery({
        queryKey: ["admin-web-requests", params],
        queryFn: () => getWebRequests(params),
    })
}

