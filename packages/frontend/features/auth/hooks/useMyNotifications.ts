"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getMyNotifications } from "@/features/auth/api/getMyNotifications"
import { markMyNotificationRead } from "@/features/auth/api/markMyNotificationRead"

type UseMyNotificationsOptions = {
    enabled?: boolean
    refetchInterval?: number | false
    refetchIntervalInBackground?: boolean
}

export function useMyNotifications({
    enabled = true,
    refetchInterval = 5000,
    refetchIntervalInBackground = true,
}: UseMyNotificationsOptions = {}) {
    return useQuery({
        queryKey: ["my-notifications"],
        queryFn: getMyNotifications,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval,
        refetchIntervalInBackground,
        enabled,
    })
}

export function useMarkMyNotificationRead() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: markMyNotificationRead,
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["my-notifications"] })
        },
    })
}
