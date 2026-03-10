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
    | "CERTIFICATE"

export type Asset = {
    id: string
    key: string
    mimeType: string
    type: AssetType
    role: AssetRole
    url: string
    createdAt: string
    updatedAt: string
}