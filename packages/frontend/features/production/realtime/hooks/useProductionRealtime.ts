"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

import {
    parseProductionChangeMessage,
    type ProductionChangeScope,
} from "@core/helpers/production/productionRealtime"
import { useRealtimeTopic, type RealtimeStatus } from "@/features/realtime/hooks/useRealtimeTopic"
import { productionChangeQueryKeys } from "@/features/production/realtime/utils/productionChangeQueryKeys"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Art arda gelen değişiklikler (ör. kaydırılan birkaç iş) tek tazelemede birleşir. */
const COALESCE_MS = 400

export type ProductionLastChange = {
    occurredAt: string
    scopes: ProductionChangeScope[]
    /** Değişikliği bu kullanıcı mı yaptı (başka sekmeden de olabilir). */
    byMe: boolean
}

export type ProductionRealtimeState = {
    status: RealtimeStatus
    lastChange: ProductionLastChange | null
}

/**
 * `/uretim` paneli canlı güncellemesi (4.4): üretim değişiklik konusuna abone olur, gelen alanlara
 * göre ilgili sorguları geçersiz kılar (veri API'den yetkiyle yeniden çekilir). Kullanıcının kendi
 * değişikliği de yayınlanır ve yok SAYILMAZ: aynı kullanıcının diğer sekmesi de tazelenmeli
 * (`refetchOnWindowFocus` kapalı). Bağlantı kopup gelince kaçan değişiklikler için bir kez her şey
 * tazelenir. Panel başına BİR kez (`ProductionRealtimeProvider`) çalışır.
 */
export function useProductionRealtime(): ProductionRealtimeState {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const myUserId = session?.user?.dbUserId ?? null
    const [lastChange, setLastChange] = useState<ProductionLastChange | null>(null)
    const pendingScopes = useRef(new Set<ProductionChangeScope>())
    const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (flushTimer.current) clearTimeout(flushTimer.current)
    }, [])

    function flush() {
        flushTimer.current = null
        const keys = productionChangeQueryKeys(pendingScopes.current)
        pendingScopes.current = new Set()
        for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey })
    }

    const status = useRealtimeTopic({
        topic: process.env.NEXT_PUBLIC_REALTIME_PRODUCTION_TOPIC ?? null,
        onMessage: (payload) => {
            const message = parseProductionChangeMessage(new TextDecoder("utf-8").decode(payload))
            if (!message) return
            setLastChange({
                occurredAt: message.occurredAt,
                scopes: message.scopes,
                byMe: Boolean(myUserId) && message.actorUserId === myUserId,
            })
            for (const scope of message.scopes) pendingScopes.current.add(scope)
            if (!flushTimer.current) flushTimer.current = setTimeout(flush, COALESCE_MS)
        },
        onSubscribed: ({ resumed }) => {
            if (resumed) void queryClient.invalidateQueries({ queryKey: productionQueryKeys.all })
        },
    })

    return { status, lastChange }
}
