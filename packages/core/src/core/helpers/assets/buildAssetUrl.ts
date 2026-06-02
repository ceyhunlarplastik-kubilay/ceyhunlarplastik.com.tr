export function buildAssetUrl(key: string): string {
    if (/^https?:\/\//i.test(key)) {
        return key
    }

    const base = process.env.ASSET_PUBLIC_BASE_URL?.replace(/\/$/, "")
    if (base) {
        return `${base}/${key}`
    }

    const bucketName = process.env.BUCKET_NAME?.trim()
    if (bucketName) {
        return `https://${bucketName}.s3.amazonaws.com/${key}`
    }

    if (process.env.NODE_ENV !== "production") {
        console.warn("buildAssetUrl fallback used because asset base URL is not configured")
    }

    return key
}
