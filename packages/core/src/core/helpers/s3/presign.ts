import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

const s3 = new S3Client({})

function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "-")
}

function getFolderByType(type: string) {
    switch (type) {
        case "IMAGE":
            return "images"
        case "VIDEO":
            return "videos"
        case "PDF":
            return "pdf"
        case "TECHNICAL_DRAWING":
            return "technical-drawings"
        case "CERTIFICATE":
            return "certificates"
        default:
            return "misc"
    }
}

function getFolderByRole(role: string) {
    switch (role) {
        case "PRIMARY":
            return "primary"

        case "ANIMATION":
            return "animation"

        case "GALLERY":
            return "gallery"

        case "DOCUMENT":
            return "documents"

        case "TECHNICAL_DRAWING":
            return "technical-drawings"

        case "MODEL_3D":
            return "3d-models"

        case "CERTIFICATE":
            return "certificates"

        default:
            return "misc"
    }
}

/**
 * ASSET_PUBLIC_BASE_URL:
 * - prod/dev/test-1: CloudFront (bucket CDN) domainini buraya koy (örn https://xxxx.cloudfront.net)
 * - local: istersen boş bırak; localda public bucket ise s3 url fallback çalışır
 */
function buildPublicUrl(key: string) {
    const base = process.env.ASSET_PUBLIC_BASE_URL?.replace(/\/$/, "")
    if (base) return `${base}/${key}`

    // fallback (sadece bucket public ise çalışır)
    const bucket = process.env.BUCKET_NAME
    return `https://${bucket}.s3.amazonaws.com/${key}`
}

export async function generateCategoryAssetUpload({
    assetId,
    categorySlug,
    assetRole,
    fileName,
    contentType,
}: {
    /**
     * Asset satırının id'si. Key'in dosya adı bu id'dir; S3 ObjectCreated event'i
     * key üzerinden satırı bulup PENDING_UPLOAD → ACTIVE çevirir
     * (confirmCategoryAssetUpload). Çağıran presign handler'ı üretir ve aynı id
     * ile createPendingAsset yazar.
     */
    assetId: string
    categorySlug: string
    assetRole: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined

    const folder = getFolderByRole(assetRole)
    const key = `categories/${categorySlug}/${folder}/${assetId}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    // 900s: büyük dosya + yavaş uplink için pay. Süre yalnız PUT'un başlaması
    // için geçerli; asıl DB yazımı S3 event'iyle asenkron ilerler.
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 900 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}

/**
 * Tedarikçi sözlüğü teknik resmi (ürün modeli + tedarikçi harfi başına TEK).
 * Kategori akışının aynısı: `assetId` key'in dosya adı olur, S3 ObjectCreated
 * event'i key üzerinden PENDING_UPLOAD satırını bulup ACTIVE'e çevirir
 * (confirmProductSupplierCodeAssetUpload). type & role sabittir: TECHNICAL_DRAWING.
 */
export async function generateProductSupplierCodeAssetUpload({
    assetId,
    productId,
    codeId,
    fileName,
    contentType,
}: {
    assetId: string
    productId: string
    codeId: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined

    const key = `product-supplier-codes/${productId}/${codeId}/${assetId}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    // 900s: teknik resim büyük olabilir + yavaş uplink. DB yazımı S3 event'iyle
    // asenkron ilerler.
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 900 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}


export async function generateProductAssetUpload({
    productSlug,
    assetRole,
    fileName,
    contentType,
}: {
    productSlug: string
    assetRole: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined
    const uuid = randomUUID()

    const folder = getFolderByRole(assetRole)

    const key = `products/${productSlug}/${folder}/${uuid}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}

export async function generateProductIndustrialUsageImageUpload({
    productSlug,
    fileName,
    contentType,
    locale,
}: {
    productSlug: string
    fileName: string
    contentType: string
    /**
     * Kullanım görselleri dile göre değişebilir (görselin içinde yazı var).
     * Verildiğinde key'e bir locale segmenti eklenir; verilmezse eski şablon
     * korunur, böylece mevcut key'ler etkilenmez.
     */
    locale?: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined
    const uuid = randomUUID()
    const localeSegment = locale ? `${sanitizeFileName(locale)}/` : ""
    const key = `products/${productSlug}/industrial-usages/${localeSegment}${uuid}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}

export async function generateProductAttributeValueAssetUpload({
    attributeCode,
    valueSlug,
    assetRole,
    fileName,
    contentType,
}: {
    attributeCode: string
    valueSlug: string
    assetRole: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined
    const uuid = randomUUID()
    const folder = getFolderByRole(assetRole)
    const key = `product-attribute-values/${attributeCode}/${valueSlug}/${folder}/${uuid}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}

export async function generateMaterialAssetUpload({
    materialId,
    assetRole,
    fileName,
    contentType,
}: {
    materialId: string
    assetRole: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined
    const uuid = randomUUID()
    const folder = getFolderByRole(assetRole)
    const key = `materials/${materialId}/${folder}/${uuid}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}

export async function generateUserProfileImageUpload({
    userId,
    fileName,
    contentType,
}: {
    userId: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined
    const uuid = randomUUID()
    const key = `users/${userId}/profile/${uuid}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 })

    return {
        uploadUrl,
        key,
        url: buildPublicUrl(key),
    }
}
