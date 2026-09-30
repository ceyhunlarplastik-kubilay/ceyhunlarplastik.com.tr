"use client"

import { useEffect, useState } from "react"

/**
 * Belirli aralıkla tazelenen "şimdi". Render içinde `new Date()` çağırmak saf değil
 * (react-hooks/purity) ve "sürüyor / yaklaşıyor" gibi etiketler sayfa açık kaldıkça
 * bayatlar; bu hook ikisini de çözer.
 */
export function useNow(refreshMs = 60_000): Date {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), refreshMs)
        return () => window.clearInterval(timer)
    }, [refreshMs])

    return now
}
