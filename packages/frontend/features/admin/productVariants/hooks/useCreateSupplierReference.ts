import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createSupplierReference } from "@/features/admin/productVariants/api/createSupplierReference"

export function useCreateSupplierReference() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createSupplierReference,
        onSuccess() {
            toast.success("Tedarikçi oluşturuldu")
            queryClient.invalidateQueries({
                queryKey: ["admin-product-variant-references"],
            })
        },
        onError() {
            toast.error("Tedarikçi oluşturulamadı")
        },
    })
}
