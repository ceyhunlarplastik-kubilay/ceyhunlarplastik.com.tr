import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createColorReference } from "@/features/admin/productVariants/api/createColorReference"

export function useCreateColorReference() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createColorReference,
        onSuccess() {
            toast.success("Renk oluşturuldu")
            queryClient.invalidateQueries({
                queryKey: ["admin-product-variant-references"],
            })
        },
        onError() {
            toast.error("Renk oluşturulamadı")
        },
    })
}
