"use client"

import { useQuery } from "@tanstack/react-query"

import { getUsers } from "@/features/admin/users/api/getUsers"

type Params = {
    page: number
    limit: number
    search?: string
}

export function useUsers(params: Params) {
    return useQuery({
        queryKey: ["admin-users", params],
        queryFn: () => getUsers(params),
    })
}
