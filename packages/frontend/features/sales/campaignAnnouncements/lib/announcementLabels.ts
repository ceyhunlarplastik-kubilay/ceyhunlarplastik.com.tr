import type {
    CampaignAnnouncement,
    CampaignAnnouncementChannel,
    CampaignAnnouncementRecipientStatus,
} from "@/features/sales/campaignAnnouncements/api/types"

export const STATUS_LABELS: Record<CampaignAnnouncementRecipientStatus, string> = {
    PENDING: "Bekliyor",
    REACHED: "Ulaşıldı",
    RESPONDED: "Yanıt Var",
    NOT_INTERESTED: "İlgilenmiyor",
    UNREACHABLE: "Ulaşılamadı",
}

export const STATUS_STYLES: Record<CampaignAnnouncementRecipientStatus, string> = {
    PENDING: "bg-neutral-100 text-neutral-700",
    REACHED: "bg-sky-100 text-sky-800",
    RESPONDED: "bg-emerald-100 text-emerald-800",
    NOT_INTERESTED: "bg-amber-100 text-amber-900",
    UNREACHABLE: "bg-red-100 text-red-800",
}

export const CHANNEL_LABELS: Record<CampaignAnnouncementChannel, string> = {
    MANUAL: "Telefon / Elden",
    EMAIL: "E-posta",
    WHATSAPP: "WhatsApp",
}

/**
 * Bu aşamada sistem hiçbir ileti göndermiyor: temsilci kendi kanalından iletişime
 * geçer, sistem yalnız kaydı tutar. E-posta ve WhatsApp otomasyonu açılmadığı
 * için seçilebilir ama "temsilci elle iletir" anlamına gelir.
 */
export const AUTOMATED_CHANNELS: CampaignAnnouncementChannel[] = []

export function isChannelAutomated(channel: CampaignAnnouncementChannel) {
    return AUTOMATED_CHANNELS.includes(channel)
}

export type AnnouncementProgress = {
    total: number
    pending: number
    reached: number
    responded: number
    /** Temas kurulmuş alıcı oranı (0-100). */
    contactedPercent: number
}

/** Duyuru başlığında gösterilen ilerleme özeti — saf, bu yüzden testlenebilir. */
export function summarizeAnnouncement(announcement: CampaignAnnouncement): AnnouncementProgress {
    const recipients = announcement.recipients ?? []
    const total = recipients.length

    const pending = recipients.filter((item) => item.status === "PENDING").length
    const reached = recipients.filter((item) => item.status === "REACHED").length
    const responded = recipients.filter((item) => item.status === "RESPONDED").length

    // "Temas kuruldu" = artık beklemede olmayan her satır (olumsuz dönüş ve
    // ulaşılamama da bir sonuçtur, temsilci o satırı işlemiştir).
    const contacted = total - pending

    return {
        total,
        pending,
        reached,
        responded,
        contactedPercent: total === 0 ? 0 : Math.round((contacted / total) * 100),
    }
}
