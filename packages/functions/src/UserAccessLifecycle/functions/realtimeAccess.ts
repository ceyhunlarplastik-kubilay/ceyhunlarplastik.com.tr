import { hasProductionAccess } from "@/functions/shared/production/access"

/**
 * Realtime (IoT) abonelik kuralları — SAF, yetkilendiriciden ayrı test edilir.
 *
 *  - Kendi erişim konusu + kendi bildirim konusu: aktif her kullanıcı (onay bekleyen kullanıcı da
 *    `/hesabim`'de erişim kararını canlı alır).
 *  - Üretim değişiklik konusu (4.4): erişim durumu ACTIVE ve üretim planlama yetkili gruplar.
 *    Rol / durum her yetkilendirici yenilemesinde (5 dk) veritabanından yeniden okunur.
 */
export type RealtimeAuthUser = {
    id: string
    isActive: boolean
    accessStatus: string
    groups: string[]
}

export type RealtimeTopicEnv = {
    USER_ACCESS_REALTIME_TOPIC_PREFIX?: string
    USER_NOTIFICATION_REALTIME_TOPIC_PREFIX?: string
    PRODUCTION_REALTIME_TOPIC?: string
}

export function realtimeSubscriptions(input: { sub: string; user: RealtimeAuthUser; env: RealtimeTopicEnv }): string[] {
    const { sub, user, env } = input
    if (!user.isActive) return []
    return [
        ...(env.USER_ACCESS_REALTIME_TOPIC_PREFIX ? [`${env.USER_ACCESS_REALTIME_TOPIC_PREFIX}/${sub}/access`] : []),
        ...(env.USER_NOTIFICATION_REALTIME_TOPIC_PREFIX ? [`${env.USER_NOTIFICATION_REALTIME_TOPIC_PREFIX}/${user.id}`] : []),
        ...(env.PRODUCTION_REALTIME_TOPIC && user.accessStatus === "ACTIVE" && hasProductionAccess(user.groups)
            ? [env.PRODUCTION_REALTIME_TOPIC]
            : []),
    ]
}

/** IoT'nin kabul ettiği bağlantı ömrü aralığı (sn). */
const MIN_SESSION_SECONDS = 300
const MAX_SESSION_SECONDS = 86_400

/**
 * Bağlantı, kimlik jetonunun süresi dolunca kesilir: süresi geçmiş jetonla açık kalan bağlantı
 * sessizce mesaj almayı bırakırdı. İstemci süre dolmadan yeni jetonla yeniden bağlanır.
 */
export function realtimeSessionSeconds(tokenExpSec: number | undefined, nowSec: number): number {
    if (typeof tokenExpSec !== "number" || !Number.isFinite(tokenExpSec)) return MAX_SESSION_SECONDS
    return Math.min(MAX_SESSION_SECONDS, Math.max(MIN_SESSION_SECONDS, Math.floor(tokenExpSec - nowSec)))
}
