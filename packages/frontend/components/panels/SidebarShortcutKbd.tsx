"use client"

import { useSyncExternalStore } from "react"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

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
 * `components/ui/sidebar.tsx`'teki `SIDEBAR_KEYBOARD_SHORTCUT = "b"` kısayolu
 * `event.metaKey || event.ctrlKey` kontrol eder — Mac'te ⌘B, Windows/Linux'ta
 * Ctrl+B ile çalışır. Sembol platforma göre değişmezse Windows kullanıcısına
 * klavyesinde olmayan bir tuş gösterilmiş olur. `navigator` sunucuda yok;
 * `useSyncExternalStore` server snapshot'ı ("Ctrl") ile başlayıp hydration
 * sonrası gerçek platforma geçer — `useEffect`+`setState`'in aksine ekstra
 * render'ı React'in kendisi yönetir.
 */
function useIsMacPlatform() {
    return useSyncExternalStore(subscribeToNothing, getIsMacSnapshot, getIsMacServerSnapshot)
}

/** Sidebar aç/kapa kısayolunu gösteren `Kbd` çifti; tooltip içine gömülmek üzere tasarlandı. */
export function SidebarShortcutKbd() {
    const isMac = useIsMacPlatform()

    return (
        <KbdGroup>
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>B</Kbd>
        </KbdGroup>
    )
}
