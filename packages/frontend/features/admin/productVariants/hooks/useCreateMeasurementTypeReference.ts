import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createMeasurementTypeReference } from "@/features/admin/productVariants/api/createMeasurementTypeReference"

export function useCreateMeasurementTypeReference() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createMeasurementTypeReference,
        onSuccess() {
            toast.success("Ölçü tipi oluşturuldu")
            queryClient.invalidateQueries({
                queryKey: ["admin-product-variant-references"],
            })
        },
        onError() {
            toast.error("Ölçü tipi oluşturulamadı")
        },
    })
}
