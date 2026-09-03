"use client"

import { useEffect, useRef, useState } from "react"
import type { Asset } from "@/features/public/assets/types"

const POLL_INTERVAL_MS = 2500
// ~30 sn. S3 ObjectCreated onayı normalde 1-2 sn; bu tavan, event hiç gelmezse
// (asılı PENDING satır) sonsuz poll'u engeller — satır yönetimde rozetle kalır.
const MAX_POLLS = 12

/**
 * Kategori yönetim dialog'unda: `category.assets` içinde `PENDING_UPLOAD` bir asset
 * varken `refetchCategory`'yi periyodik çağırır; S3 event'i satırı ACTIVE'e
 * çevirince rozet kendiliğinden kalkar. Bekleyen kalmayınca sayaç sıfırlanır,
 * bir sonraki yükleme yeniden başlatır.
 */
export function usePendingAssetReconciler(
    assets: Asset[] | undefined,
    refetchCategory: () => Promise<void>,
) {
    const pollsRef = useRef(0)
    const [tick, setTick] = useState(0)

    const pendingCount = (assets ?? []).filter(
        (asset) => asset.uploadStatus === "PENDING_UPLOAD",
    ).length

    useEffect(() => {
        if (pendingCount === 0) {
            pollsRef.current = 0
            return
        }

        if (pollsRef.current >= MAX_POLLS) return

        let cancelled = false

        const timer = setTimeout(async () => {
            pollsRef.current += 1
            try {
                await refetchCategory()
            } finally {
                // pendingCount değişmese bile bir sonraki döngüyü tetikle.
                if (!cancelled) setTick((value) => value + 1)
            }
        }, POLL_INTERVAL_MS)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [pendingCount, tick, refetchCategory])
}
