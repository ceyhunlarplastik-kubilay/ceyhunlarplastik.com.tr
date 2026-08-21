"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    createVariantVersion,
    deleteVariantVersion,
    getVariantVersions,
} from "@/features/admin/variantVersions/api/variantVersions"
import type { CreateVariantVersionInput } from "@/features/admin/variantVersions/api/types"

const buildQueryKey = (productId: string) => ["admin-variant-versions", productId] as const

export function useVariantVersions(productId: string) {
    return useQuery({
        queryKey: buildQueryKey(productId),
        queryFn: () => getVariantVersions(productId),
        placeholderData: (previous) => previous,
    })
}

function useDictionaryInvalidation(productId: string) {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: buildQueryKey(productId) })
        // Matris ekranı sözlüğü kod önizlemesi ve satır doğrulaması için taşıyor.
        queryClient.invalidateQueries({ queryKey: ["admin-variant-matrix", productId] })
    }
}

export function useCreateVariantVersion(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: (input: CreateVariantVersionInput) => createVariantVersion(productId, input),
        onSuccess(version) {
            toast.success(`V${version.code} tanımlandı`)
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Versiyon oluşturulamadı")
        },
    })
}

export function useDeleteVariantVersion(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: (versionId: string) => deleteVariantVersion(productId, versionId),
        onSuccess() {
            toast.success("Versiyon silindi")
            invalidate()
        },
        onError(error: any) {
            // Kullanımdaki kombinasyon silinemez — sunucu kaç varyantın
            // kullandığını mesajda söylüyor.
            toast.error(error?.response?.data?.message ?? "Versiyon silinemedi")
        },
    })
}
