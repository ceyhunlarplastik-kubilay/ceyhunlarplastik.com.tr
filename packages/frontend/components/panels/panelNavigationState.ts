import type { PanelNavGroup, PanelNavItem } from "@/components/panels/types"

/**
 * Panel navigasyonunun AKTİFLİK kuralı — saf, bu yüzden testli.
 *
 * İki tüketicisi var ve ikisi de aynı cevabı vermek zorunda: sidebar'daki vurgu
 * ve mobil üst çubuktaki sayfa adı. Ayrışırlarsa menüde bir madde vurguluyken
 * başlıkta başka bir sayfa yazar.
 */

export function isPanelNavItemActive(item: PanelNavItem, pathname: string) {
    if (item.match === "exact") return pathname === item.href

    // `startsWith(href)` YETMEZ: "/admin/users" ile "/admin/user" gibi ön ek
    // komşuları yanlışlıkla eşleşirdi. Ayırıcı şart.
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * Mobil üst çubukta gösterilecek sayfa adı. Eşleşme yoksa `null` döner ve
 * çağıran panel adına düşer.
 */
export function resolveActivePanelNavLabel(
    navGroups: PanelNavGroup[],
    pathname: string,
): string | null {
    const matches = navGroups
        .flatMap((group) => group.items)
        .filter((item) => isPanelNavItemActive(item, pathname))

    if (matches.length === 0) return null

    // Birden fazla eşleşmede EN UZUN href kazanır: "/satis" ile
    // "/satis/urunler" aynı anda eşleşebilir, kullanıcıya derin olan gösterilir.
    return matches.reduce((deepest, item) =>
        item.href.length > deepest.href.length ? item : deepest,
    ).label
}
