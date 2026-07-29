/**
 * YouTube video linki ayrıştırma/üretme yardımcıları.
 *
 * Ürün videoları (montaj + tanıtım) S3'te değil YouTube'da barındırılır; DB'de
 * yalnızca kanonik watch URL'i saklanır ve gömme/thumbnail adresleri buradan
 * türetilir.
 *
 * ÖNEMLİ: Bu dosya bilinçli olarak IMPORTSUZDUR. Hem backend (Lambda) hem de
 * frontend `@core/helpers/products/youtubeVideo` alias'ıyla aynı dosyayı
 * kullanır; `http-errors` gibi node bağımlılıkları buraya değil, çağıran
 * tarafa (bkz. productVideos.ts) aittir.
 */

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

const WATCH_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
])

const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"])

// /embed/<id>, /shorts/<id>, /live/<id>, /v/<id> — hepsinde id ikinci segment.
const PATH_PREFIXES_WITH_ID = new Set(["embed", "shorts", "live", "v"])

function toVideoId(raw: string | null | undefined): string | null {
    if (!raw) return null
    return YOUTUBE_VIDEO_ID_PATTERN.test(raw) ? raw : null
}

/**
 * Desteklenen girdiler (protokol opsiyonel):
 *   https://www.youtube.com/watch?v=<id>[&list=...&t=...]
 *   https://youtu.be/<id>[?t=...&si=...]
 *   https://www.youtube.com/embed/<id>
 *   https://www.youtube.com/shorts/<id>
 *   https://www.youtube.com/live/<id>
 *   https://www.youtube-nocookie.com/embed/<id>
 *
 * Tanınmayan her şey için `null` döner (atmaz) — çağıran taraf hata sınıfına karar verir.
 */
export function extractYoutubeVideoId(input: string | null | undefined): string | null {
    if (typeof input !== "string") return null

    const trimmed = input.trim()
    if (!trimmed) return null

    // Kullanıcı "youtu.be/xyz" gibi protokolsüz yapıştırabilir.
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

    let url: URL
    try {
        url = new URL(candidate)
    } catch {
        return null
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") return null

    const host = url.hostname.toLowerCase()
    const segments = url.pathname.split("/").filter(Boolean)

    if (SHORT_HOSTS.has(host)) {
        return toVideoId(segments[0])
    }

    if (!WATCH_HOSTS.has(host)) return null

    const [first, second] = segments

    if (!first || first === "watch") {
        return toVideoId(url.searchParams.get("v"))
    }

    if (PATH_PREFIXES_WITH_ID.has(first)) {
        return toVideoId(second)
    }

    return null
}

/** Geçerli bir YouTube linkini kanonik watch URL'ine indirger, değilse `null`. */
export function normalizeYoutubeUrl(input: string | null | undefined): string | null {
    const videoId = extractYoutubeVideoId(input)
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null
}

/**
 * Gömme adresi. `youtube-nocookie` kullanılır: kullanıcı videoyu oynatana kadar
 * (facade player sayesinde iframe zaten basılmaz) takip çerezi yazılmaz.
 */
export function buildYoutubeEmbedUrl(
    videoId: string,
    options: { autoplay?: boolean } = {},
): string {
    const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
    })

    if (options.autoplay) params.set("autoplay", "1")

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

/**
 * Kapak görseli. `hqdefault` her video için garanti üretilir (`maxresdefault`
 * üretilmediğinde gri 120x90 placeholder döner, o yüzden tercih edilmez).
 */
export function buildYoutubeThumbnailUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
