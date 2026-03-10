import { useMutation } from "@tanstack/react-query"
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
}