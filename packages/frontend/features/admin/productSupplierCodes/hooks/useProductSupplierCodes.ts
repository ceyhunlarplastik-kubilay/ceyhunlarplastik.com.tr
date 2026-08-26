"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    createProductSupplierCode,
    deleteProductSupplierCode,
    getProductSupplierCodes,
    updateProductSupplierCode,
} from "@/features/admin/productSupplierCodes/api/productSupplierCodes"
import type { CreateProductSupplierCodeInput } from "@/features/admin/productSupplierCodes/api/types"

const buildQueryKey = (productId: string) => ["admin-product-supplier-codes", productId] as const

export function useProductSupplierCodes(productId: string) {
    return useQuery({
        queryKey: buildQueryKey(productId),
        queryFn: () => getProductSupplierCodes(productId),
        placeholderData: (previous) => previous,
    })
}

function useDictionaryInvalidation(productId: string) {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: buildQueryKey(productId) })
        // Matris harfleri kod önizlemesinde kullanıyor.
        queryClient.invalidateQueries({ queryKey: ["admin-variant-matrix", productId] })
    }
}

export function useCreateProductSupplierCode(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: (input: CreateProductSupplierCodeInput) => createProductSupplierCode(productId, input),
        onSuccess(code) {
            toast.success(`${code.code} harfi ${code.supplier.name} için tanımlandı`)
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Tedarikçi harfi oluşturulamadı")
        },
    })
}

export function useUpdateProductSupplierCode(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: ({ codeId, supplierId }: { codeId: string; supplierId: string }) =>
            updateProductSupplierCode(productId, codeId, supplierId),
        onSuccess(code) {
            toast.success(`${code.code} artık ${code.supplier.name}`)
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Tedarikçi harfi güncellenemedi")
        },
    })
}

export function useDeleteProductSupplierCode(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: (codeId: string) => deleteProductSupplierCode(productId, codeId),
        onSuccess() {
            toast.success("Tedarikçi harfi silindi")
            invalidate()
        },
        onError(error: any) {
            // Kullanımdaki harf silinemez — sunucu kaç satırın kullandığını söyler.
            toast.error(error?.response?.data?.message ?? "Tedarikçi harfi silinemedi")
        },
    })
}
