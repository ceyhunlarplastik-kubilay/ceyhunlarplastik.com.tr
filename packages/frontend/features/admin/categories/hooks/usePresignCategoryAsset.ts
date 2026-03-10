import { useMutation } from "@tanstack/react-query"
import { presignCategoryAsset } from "../api/presignCategoryAsset"

export function usePresignCategoryAsset() {

    return useMutation({
        mutationFn: presignCategoryAsset
    })

}