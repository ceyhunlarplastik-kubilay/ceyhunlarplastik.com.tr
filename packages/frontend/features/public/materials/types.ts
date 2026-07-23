import type { Asset } from "@/features/public/assets/types"

export type PublicMaterial = {
    id: string
    name: string
    locale?: "tr" | "en"
    resolvedLocale?: string
    translationMissing?: boolean
    code?: string | null
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}
