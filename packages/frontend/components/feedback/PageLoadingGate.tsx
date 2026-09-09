"use client"

import { useEffect, useState, type ReactNode } from "react"

type Props = {
    children: ReactNode
    overlay: ReactNode
    /** @default 900 */
    minDurationMs?: number
}

/**
 * `overlay`'i EN AZ `minDurationMs` süresince gösterir, sonra `children`'a
 * geçer.
 *
 * NEDEN GEREKLİ: Next.js'in route-bazlı `loading.tsx`'i yalnız sayfanın
 * SUNUCU tarafında gerçekten askıda kalan bir async sınırı varsa devreye
 * girer. Bir sayfa hiç `await` içermiyorsa (ör. veri client-side bir Zustand
 * store'undan senkron okunuyor) sunucu render'ı anında tamamlanır ve
 * `loading.tsx` fallback'inin gösterilecek hiçbir anı olmaz — özellikle SERT
 * YENİLEMEDE (Cmd+Shift+R, tam SSR) asla görünmez (yalnız yumuşak/istemci
 * navigasyonlarında, segment JS'i indirilirken kısaca görünebilir).
 * `PageLoadingGate`, sayfanın kendi render'ı içinde çalıştığı için bu
 * kısıttan bağımsızdır — HER yüklemede (yavaş/hızlı, sert/yumuşak fark
 * etmeksizin) `overlay`'in en az bir an görünmesini GARANTİ eder.
 *
 * BİLİNÇLİ ÖDÜNLEŞIM: bu, gerçek bir yükleme süresi değil, YAPAY bir minimum
 * gösterim süresidir — sayfa aslında anında hazır olsa bile kullanıcı bu
 * kadar bekler. `minDurationMs`'i sayfanın ziyaret sıklığına göre kısa tutun.
 */
export function PageLoadingGate({ children, overlay, minDurationMs = 900 }: Props) {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), minDurationMs)
        return () => clearTimeout(timer)
    }, [minDurationMs])

    if (!isReady) return overlay

    return children
}
