"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useIsMacPlatform } from "@/lib/hooks/useIsMacPlatform"

type Props = {
    className?: string
}

/**
 * Sepet drawer'ının aç/kapa kısayolunu gösteren `Kbd` üçlüsü. Claude Desktop'ın
 * sidebar kısayolu (Mac'te ⌘⌥B) örnek alındı — bare bir harften farklı olarak
 * modifier'lı bir kombinasyon, bir input'ta yazarken yanlışlıkla tetiklenmez.
 * `CustomerPortalCartDrawer.tsx`'teki keydown mantığıyla birebir eşleşmeli.
 */
export function CartShortcutKbd({ className }: Props) {
    const isMac = useIsMacPlatform()

    return (
        <KbdGroup className={className}>
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>{isMac ? "⌥" : "Alt"}</Kbd>
            <Kbd>B</Kbd>
        </KbdGroup>
    )
}
