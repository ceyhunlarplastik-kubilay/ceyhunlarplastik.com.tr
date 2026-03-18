/* import { useMutation } from "@tanstack/react-query"
import { adminApiClient } from "@/lib/http/client"
import { toast } from "sonner"

type Params = {
    assetId: string
    refetchCategory: () => Promise<void>
}

export function useDeleteAsset() {

    return useMutation({

        mutationFn: async ({ assetId }: Params) => {
            await adminApiClient.delete(`/assets/${assetId}`)
        },

        onSuccess(_, variables) {
            toast.success("Asset silindi")
            // category yeniden fetch
            variables.refetchCategory();
        },
        onError() {
            toast.error("Asset silinemedi");
        }
    })
} */

"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApiClient } from "@/lib/http/client"
import { toast } from "sonner"

type Params = {
    assetId: string
}

export function useDeleteAsset() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ assetId }: Params) => {
            await adminApiClient.delete(`/assets/${assetId}`)
        },
        onSuccess() {
            toast.success("Asset silindi")
            queryClient.invalidateQueries({
                queryKey: ["admin-categories"]
            })
            queryClient.invalidateQueries({
                queryKey: ["admin-products"]
            })
        },
        onError() {
            toast.error("Asset silinemedi")
        }
    })
}
