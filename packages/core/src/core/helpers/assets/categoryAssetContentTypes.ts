/**
 * Kategori görsellerinde izin verilen içerik tipleri — asset tipi başına.
 *
 * Presign, istemcinin bildirdiği `contentType`'ı imzaya koyar ve dosya public CDN'den
 * o tiple servis edilir. Liste yoksa `text/html` ya da `image/svg+xml` (içinde script
 * taşıyabilir) yüklenip CDN alan adından çalıştırılabilirdi. Bu yüzden İZİN LİSTESİ.
 *
 * Saf modül — hiçbir import YOK: frontend `@core/helpers/assets/categoryAssetContentTypes`
 * ile okur (dosya seçici `accept`'i aynı listeden kurulur).
 */
const RASTER_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] as const
const VIDEOS = ["video/mp4", "video/webm", "video/quicktime"] as const
const PDF = ["application/pdf"] as const

export const CATEGORY_ASSET_CONTENT_TYPES = {
    IMAGE: RASTER_IMAGES,
    VIDEO: VIDEOS,
    PDF,
    TECHNICAL_DRAWING: [...PDF, ...RASTER_IMAGES],
    CERTIFICATE: [...PDF, ...RASTER_IMAGES],
} as const

export type CategoryAssetType = keyof typeof CATEGORY_ASSET_CONTENT_TYPES

/** Herhangi bir asset tipinde izinli tüm içerik tipleri (request validator'ın enum'u). */
export const ALL_CATEGORY_ASSET_CONTENT_TYPES = [
    ...new Set(Object.values(CATEGORY_ASSET_CONTENT_TYPES).flat()),
] as [string, ...string[]]

export function isAllowedCategoryAssetContentType(assetType: string, contentType: string): boolean {
    const allowed = CATEGORY_ASSET_CONTENT_TYPES[assetType as CategoryAssetType] as readonly string[] | undefined
    return Boolean(allowed?.includes(contentType))
}
