import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCategory } from "../api/createCategory"
import { toast } from "sonner"

export function useCreateCategory() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: createCategory,
        onSuccess() {
            toast.success("Kategori oluşturuldu")

            qc.invalidateQueries({
                queryKey: ["admin-categories"]
            })
        },
        onError() {
            toast.error("Kategori oluşturulamadı")
        }
    })
}
