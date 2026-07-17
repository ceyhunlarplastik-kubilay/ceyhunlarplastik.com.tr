import type { Asset } from "@/features/public/assets/types"

export type CategoryTranslation = {
    id: string
    locale: string
    name: string
    slug: string
    createdAt: string
    updatedAt: string
}

export type Category = {
    id: string
    code: number
    name: string
    slug: string
    locale: "tr" | "en"
    resolvedLocale: string
    translationMissing: boolean
    alternateSlugs: Record<string, string>
    translations: CategoryTranslation[]
    allowedAttributeValueIds?: string[]
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}
