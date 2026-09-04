"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    createProductSupplierCode,
    deleteProductSupplierCode,
    deleteProductSupplierCodeDrawing,
    getProductSupplierCodes,
    presignProductSupplierCodeDrawing,
    updateProductSupplierCode,
} from "@/features/admin/productSupplierCodes/api/productSupplierCodes"
import type {
    CreateProductSupplierCodeInput,
    ProductSupplierCodeEntry,
} from "@/features/admin/productSupplierCodes/api/types"

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
    // Sabit referans: teknik resim reconciler'ı bunu effect bağımlılığında kullanıyor.
    return useCallback(() => {
        queryClient.invalidateQueries({ queryKey: buildQueryKey(productId) })
        // Matris harfleri kod önizlemesinde kullanıyor.
        queryClient.invalidateQueries({ queryKey: ["admin-variant-matrix", productId] })
    }, [queryClient, productId])
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

/**
 * Harf başına TEK teknik resim yükler. `replaceAssetId` verilirse önce eskiyi
 * senkron siler (S3 + satır), sonra presign + S3'e PUT. DB satırı S3 event'iyle
 * ACTIVE'e döner — kullanıcı beklemez.
 */
export function useUploadProductSupplierCodeDrawing(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: async ({
            codeId,
            file,
            replaceAssetId,
        }: {
            codeId: string
            file: File
            replaceAssetId?: string | null
        }) => {
            if (replaceAssetId) {
                await deleteProductSupplierCodeDrawing(replaceAssetId)
            }

            const contentType = file.type || "application/octet-stream"
            const presigned = await presignProductSupplierCodeDrawing(productId, codeId, {
                fileName: file.name,
                contentType,
            })

            await axios.put(presigned.uploadUrl, file, {
                headers: { "Content-Type": contentType },
            })

            return presigned
        },
        onSuccess() {
            toast.success("Teknik resim yüklendi — arka planda işleniyor")
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Teknik resim yüklenemedi")
        },
    })
}

export function useDeleteProductSupplierCodeDrawing(productId: string) {
    const invalidate = useDictionaryInvalidation(productId)

    return useMutation({
        mutationFn: (assetId: string) => deleteProductSupplierCodeDrawing(assetId),
        onSuccess() {
            toast.success("Teknik resim silindi")
            invalidate()
        },
        onError(error: any) {
            toast.error(error?.response?.data?.message ?? "Teknik resim silinemedi")
        },
    })
}

const DRAWING_POLL_INTERVAL_MS = 2500
// ~30 sn tavan. S3 ObjectCreated onayı normalde 1-2 sn; event hiç gelmezse
// (asılı PENDING satır) sonsuz poll'u engeller — satır rozetle kalır.
const DRAWING_MAX_POLLS = 12

/**
 * Sözlük dialog'unda: bir harfin `technicalDrawing.uploadStatus` `PENDING_UPLOAD`
 * iken listeyi periyodik tazeler; S3 onayı gelince rozet kendiliğinden kalkar.
 * Bekleyen kalmayınca sayaç sıfırlanır, bir sonraki yükleme yeniden başlatır.
 */
export function usePendingSupplierCodeDrawingReconciler(
    codes: ProductSupplierCodeEntry[] | undefined,
    productId: string,
) {
    const invalidate = useDictionaryInvalidation(productId)
    const pollsRef = useRef(0)
    const [tick, setTick] = useState(0)

    const pendingCount = (codes ?? []).filter(
        (entry) => entry.technicalDrawing?.uploadStatus === "PENDING_UPLOAD",
    ).length

    useEffect(() => {
        if (pendingCount === 0) {
            pollsRef.current = 0
            return
        }

        if (pollsRef.current >= DRAWING_MAX_POLLS) return

        let cancelled = false

        const timer = setTimeout(() => {
            pollsRef.current += 1
            invalidate()
            // pendingCount değişmese bile bir sonraki döngüyü tetikle.
            if (!cancelled) setTick((value) => value + 1)
        }, DRAWING_POLL_INTERVAL_MS)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [pendingCount, tick, invalidate])
}
