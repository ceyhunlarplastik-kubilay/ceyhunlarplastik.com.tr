"use client"

import { useSyncExternalStore } from "react"

function subscribeToNothing() {
    // Platform, mount sonrası değişmez; `useSyncExternalStore` yalnız
    // sunucu/istemci snapshot'ları arasında güvenli geçiş için kullanılıyor.
    return () => {}
}

function getIsMacSnapshot() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}

function getIsMacServerSnapshot() {
    return false
}

/**
 * Klavye kısayolu ipuçlarında (⌘ vs Ctrl, ⌥ vs Alt) doğru sembolü göstermek
 * için. `navigator` sunucuda yok; `useSyncExternalStore` server snapshot'ı
 * ("Mac değil") ile başlayıp hydration sonrası gerçek platforma geçer —
 * `useEffect`+`setState`'in aksine ekstra render'ı React'in kendisi yönetir.
 */
export function useIsMacPlatform() {
    return useSyncExternalStore(subscribeToNothing, getIsMacSnapshot, getIsMacServerSnapshot)
}
