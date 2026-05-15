"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPortalBusinessRequest } from "@/features/businessRequests/api/createPortalBusinessRequest"

export function useCreatePortalBusinessRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createPortalBusinessRequest,
        onSuccess: async () => {
            toast.success("Talep başarıyla oluşturuldu.")
            await queryClient.invalidateQueries({ queryKey: ["business-requests"] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Talep oluşturulurken bir hata oluştu."
            toast.error(message)
        },
    })
}
