"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateWebRequestStatus } from "@/features/admin/webRequests/api/updateWebRequestStatus"

export function useUpdateWebRequestStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateWebRequestStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["admin-web-requests"],
            })
        },
    })
}

