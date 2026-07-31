import type { Asset } from "@/features/public/assets/types"
import type { SupportedLocale } from "@core/i18n/locales"

export type PublicMaterial = {
    id: string
    name: string
    locale?: SupportedLocale
    resolvedLocale?: string
    translationMissing?: boolean
    code?: string | null
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}
