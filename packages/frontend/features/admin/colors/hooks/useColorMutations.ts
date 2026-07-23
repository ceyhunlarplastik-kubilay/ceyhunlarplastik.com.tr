"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createColor } from "@/features/admin/colors/api/createColor"
import { deleteColor } from "@/features/admin/colors/api/deleteColor"
import { updateColor } from "@/features/admin/colors/api/updateColor"

function useInvalidateColors() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.invalidateQueries({ queryKey: ["admin-colors"] })
        queryClient.invalidateQueries({ queryKey: ["admin-product-variant-references"] })
    }
}

export function useCreateColor() {
    const invalidate = useInvalidateColors()

    return useMutation({
        mutationFn: createColor,
        onSuccess() {
            toast.success("Renk oluşturuldu")
            invalidate()
        },
        onError() {
            toast.error("Renk oluşturulamadı")
        },
    })
}

export function useUpdateColor() {
    const invalidate = useInvalidateColors()

    return useMutation({
        mutationFn: updateColor,
        onSuccess() {
            toast.success("Renk güncellendi")
            invalidate()
        },
        onError() {
            toast.error("Renk güncellenemedi")
        },
    })
}

export function useDeleteColor() {
    const invalidate = useInvalidateColors()

    return useMutation({
        mutationFn: deleteColor,
        onSuccess() {
            toast.success("Renk silindi")
            invalidate()
        },
        onError() {
            toast.error("Renk silinemedi. Bu renk kullanılan varyantlara bağlı olabilir.")
        },
    })
}
