"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useIsMacPlatform } from "@/lib/hooks/useIsMacPlatform"

/**
 * `components/ui/sidebar.tsx`'teki `SIDEBAR_KEYBOARD_SHORTCUT = "b"` kısayolu
 * `event.metaKey || event.ctrlKey` kontrol eder — Mac'te ⌘B, Windows/Linux'ta
 * Ctrl+B ile çalışır. Sembol platforma göre değişmezse Windows kullanıcısına
 * klavyesinde olmayan bir tuş gösterilmiş olur.
 */

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
