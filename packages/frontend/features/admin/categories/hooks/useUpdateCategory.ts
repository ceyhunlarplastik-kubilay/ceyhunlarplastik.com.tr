import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCategory } from "../api/updateCategory"

export function useUpdateCategory() {

    const qc = useQueryClient()

    return useMutation({

        mutationFn: updateCategory,

        onSuccess() {
            qc.invalidateQueries({
                queryKey: ["admin-categories"]
            })
        }

    })

}