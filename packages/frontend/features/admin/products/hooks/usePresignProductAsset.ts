"use client"

import { useMutation } from "@tanstack/react-query"
import { presignProductAsset } from "@/features/admin/products/api/presignProductAsset"

export function usePresignProductAsset() {
    return useMutation({
        mutationFn: presignProductAsset
    })
}
