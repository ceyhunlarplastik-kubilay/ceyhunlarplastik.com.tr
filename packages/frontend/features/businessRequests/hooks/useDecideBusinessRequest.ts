"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { decideBusinessRequest } from "@/features/businessRequests/api/decideBusinessRequest"

export function useDecideBusinessRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: decideBusinessRequest,
        onSuccess: async ({ accepted }) => {
            if (accepted) {
                toast.success("Talep kararı kaydedildi.")
            }
            await queryClient.invalidateQueries({ queryKey: ["business-requests"] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Talep kararı kaydedilemedi."
            toast.error(message)
        },
    })
}
