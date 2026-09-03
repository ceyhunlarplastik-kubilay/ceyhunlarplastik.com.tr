export type AssetType =
    | "IMAGE"
    | "VIDEO"
    | "PDF"
    | "TECHNICAL_DRAWING"
    | "CERTIFICATE"

export type AssetRole =
    | "PRIMARY"
    | "ANIMATION"
    | "GALLERY"
    | "DOCUMENT"
    | "TECHNICAL_DRAWING"
    | "MODEL_3D"
    | "CERTIFICATE"

// PENDING_UPLOAD: presign satırı oluşturdu, S3 nesnesi henüz onaylanmadı.
// ACTIVE: S3 ObjectCreated event'i doğruladı ya da event'siz eski/senkron akış.
export type AssetUploadStatus = "PENDING_UPLOAD" | "ACTIVE"

export type Asset = {
    id: string
    key: string
    mimeType: string
    type: AssetType
    role: AssetRole
    url: string
    model3dConfig?: ProductModel3dConfig
    // Opsiyonel: yalnız kategori asset yanıtları şu an bu alanları taşıyor.
    uploadStatus?: AssetUploadStatus
    uploadedAt?: string | null
    createdAt: string
    updatedAt: string
}
import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"
