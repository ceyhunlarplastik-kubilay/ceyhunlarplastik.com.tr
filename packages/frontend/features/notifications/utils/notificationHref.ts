/**
 * Bildirime tıklanınca gidilecek panel adresi (`data.href`, ör. üretim uyarıları). Yalnız uygulama
 * İÇİ yol kabul edilir ("/…"; "//alan" ya da tam adres değil) — bildirim verisi dışarıya yönlendiremez.
 */
export function notificationHref(data: Record<string, unknown> | null | undefined): string | null {
    const href = data?.href
    if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//") || href.startsWith("/\\")) return null
    return href
}
