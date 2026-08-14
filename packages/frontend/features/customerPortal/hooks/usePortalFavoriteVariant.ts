"use client"

import { useCallback, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { CustomerAssignedProduct } from "@/features/admin/customers/api/types"
import {
    addPortalFavoriteVariant,
    removePortalFavoriteVariant,
} from "@/features/customerPortal/api/portalFavoriteVariants"
import { usePortalAssignedProducts } from "@/features/customerPortal/hooks/usePortalAssignedProducts"
import { applyFavoriteToggle } from "@/features/customerPortal/lib/favoriteVariantList"

const ASSIGNED_PRODUCTS_KEY = ["customer-portal-assigned-products"] as const

/**
 * Kalp butonunun davranışı.
 *
 * Optimistic: tıklama anında listeye yansır, sunucu yanıtı gelince gerçek satırla
 * değiştirilir, hata olursa önceki liste geri yüklenir. Optimistic satır yalnız
 * `source: "CUSTOMER"` üretir — temsilci atamaları bu yoldan hiç etkilenmez.
 */
/**
 * Müşterinin kendi favorilerindeki varyant kimlikleri. Temsilci atamaları
 * (STAFF) BİLİNÇLİ olarak dışarıda: kalp yalnız müşterinin kendi seçimini
 * yansıtmalı, yoksa müşteri temsilcinin eklediği bir satırı kaldıramadığını
 * sanır.
 */
export function usePortalFavoriteVariantIds() {
    const assignedQuery = usePortalAssignedProducts()

    return useMemo(
        () =>
            new Set(
                (assignedQuery.data ?? [])
                    .filter((item) => item.source === "CUSTOMER")
                    .map((item) => item.productVariantId),
            ),
        [assignedQuery.data],
    )
}

export function usePortalFavoriteVariants() {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: ({ productVariantId, favorite }: { productVariantId: string; favorite: boolean }) =>
            favorite
                ? addPortalFavoriteVariant(productVariantId)
                : removePortalFavoriteVariant(productVariantId),

        onMutate: async ({ productVariantId, favorite }) => {
            // Uçuştaki liste isteği optimistic veriyi ezmesin.
            await queryClient.cancelQueries({ queryKey: ASSIGNED_PRODUCTS_KEY })
            const previous = queryClient.getQueryData<CustomerAssignedProduct[]>(ASSIGNED_PRODUCTS_KEY)

            queryClient.setQueryData<CustomerAssignedProduct[]>(ASSIGNED_PRODUCTS_KEY, (current) =>
                applyFavoriteToggle(current ?? [], productVariantId, favorite),
            )

            return { previous }
        },

        onError: (error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(ASSIGNED_PRODUCTS_KEY, context.previous)
            }
            const message = error instanceof Error ? error.message : "Favori güncellenemedi."
            toast.error(message)
        },

        onSuccess: (data, { favorite }) => {
            queryClient.setQueryData(ASSIGNED_PRODUCTS_KEY, data)
            toast.success(favorite ? "Favorilerinize eklendi." : "Favorilerinizden çıkarıldı.")
        },

        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ASSIGNED_PRODUCTS_KEY })
        },
    })

    const { mutate } = mutation

    const toggleFavorite = useCallback(
        (productVariantId: string, favorite: boolean) => {
            mutate({ productVariantId, favorite })
        },
        [mutate],
    )

    return {
        toggleFavorite,
        // Hangi varyantın işlemde olduğunu bilmek, yalnız o satırın kalbini
        // beklemeye almak için gerekiyor.
        pendingVariantId: mutation.isPending ? mutation.variables?.productVariantId ?? null : null,
    }
}
