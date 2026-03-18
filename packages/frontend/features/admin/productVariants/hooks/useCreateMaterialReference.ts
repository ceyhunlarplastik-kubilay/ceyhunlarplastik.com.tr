import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createMaterialReference } from "@/features/admin/productVariants/api/createMaterialReference"

export function useCreateMaterialReference() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createMaterialReference,
        onSuccess() {
            toast.success("Malzeme oluşturuldu")
            queryClient.invalidateQueries({
                queryKey: ["admin-product-variant-references"],
            })
        },
        onError() {
            toast.error("Malzeme oluşturulamadı")
        },
    })
}
