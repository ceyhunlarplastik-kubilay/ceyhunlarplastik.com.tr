import type { Asset } from "@/features/public/assets/types"
import type { SupportedLocale } from "@core/i18n/locales"

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
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    alternateSlugs: Record<string, string>
    translations: CategoryTranslation[]
    allowedAttributeValueIds?: string[]
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}
