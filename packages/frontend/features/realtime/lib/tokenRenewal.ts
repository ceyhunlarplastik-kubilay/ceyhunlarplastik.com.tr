/**
 * Realtime bağlantısının jeton yenileme zamanlaması — SAF.
 *
 * IoT yetkilendiricisi bağlantıyı kimlik jetonunun süresi dolunca keser (sunucu tarafı:
 * `realtimeAccess.ts`). Uzun süre açık kalan ekranlar (ör. atölyedeki pano) susmasın diye istemci,
 * jeton dolmadan önce taze oturum jetonuyla yeniden bağlanır.
 */

/** Bitişten bu kadar önce yeniden bağlanılır. */
const RENEW_BEFORE_EXPIRY_MS = 2 * 60_000
/** En sık yeniden bağlanma aralığı (süresi hemen dolacak jetonla döngüye girmesin). */
const MIN_RENEW_DELAY_MS = 30_000
/** Jeton okunamazsa (beklenmedik biçim) — Cognito kimlik jetonu 1 saatliktir. */
const FALLBACK_RENEW_DELAY_MS = 50 * 60_000

/** JWT'nin `exp` alanı (sn). İmza DOĞRULANMAZ — yalnız zamanlama için okunur; çözülemezse `null`. */
export function readJwtExpirySeconds(token: string): number | null {
    const part = token.split(".")[1]
    if (!part) return null
    try {
        const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=")
        const payload = JSON.parse(atob(base64)) as { exp?: unknown }
        return typeof payload.exp === "number" && Number.isFinite(payload.exp) ? payload.exp : null
    } catch {
        return null
    }
}

export function realtimeRenewDelayMs(expirySeconds: number | null, nowMs: number): number {
    if (expirySeconds === null) return FALLBACK_RENEW_DELAY_MS
    return Math.max(MIN_RENEW_DELAY_MS, expirySeconds * 1000 - RENEW_BEFORE_EXPIRY_MS - nowMs)
}
