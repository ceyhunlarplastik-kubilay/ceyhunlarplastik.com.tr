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

        case "ASSEMBLY_VIDEO":
            return "assembly-videos"

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
    categorySlug,
    assetRole,
    fileName,
    contentType,
}: {
    categorySlug: string
    assetRole: string
    fileName: string
    contentType: string
}) {
    const safeName = sanitizeFileName(fileName)
    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined
    const uuid = randomUUID()
    // const folder = getFolderByType(assetType)
    // const key = `categories/${categorySlug}/${folder}/${uuid}${ext ? `.${ext}` : ""}`

    const folder = getFolderByRole(assetRole)
    const key = `categories/${categorySlug}/${folder}/${uuid}${ext ? `.${ext}` : ""}`

    const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
        // İstersen metadata ekleyebilirsin
        // Metadata: { assetType },
    })

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 })

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
