import type { AuditSnapshot } from "@/core/helpers/audit/types"
import { DEFAULT_LOCALE } from "@/core/i18n/locales"

type CategoryAuditSource = {
    code: number
    name: string
    slug: string
    allowedAttributeValueIds: string[]
    translations?: Array<{ locale: string; name: string; slug: string }>
}

/**
 * Kategorinin denetlenen hâli — alan yolu → değer.
 *
 * Bu liste bir İZİN LİSTESİDİR: burada olmayan alan denetim kaydına girmez. Kategoriye
 * yeni bir alan eklenirse ve değişimi izlenecekse buraya da eklenmeli.
 *
 * - `allowedAttributeValueIds` küme anlamı taşır; sıra farkı "değişiklik" sayılmasın diye
 *   sıralanır.
 * - Varsayılan dilin (TR) çevirisi legacy `name` / `slug` kolonlarının aynasıdır. Aynıyken
 *   ayrıca YAZILMAZ (yoksa her TR ad değişikliği listede iki kez görünürdü); ikisi ayrışırsa
 *   `translations.tr.*` olarak görünür — o ayrışma bir hatanın işaretidir.
 * - Görseller (`Asset`) burada YOK: ayrı modeldir, kendi denetim dilimini bekliyor.
 *
 * Ham Prisma satırıyla çağır, `localizeCategory` çıktısıyla DEĞİL: o, `name` / `slug`'ı
 * istenen dilin çevirisiyle ezer.
 */
export function toCategoryAuditSnapshot(category: CategoryAuditSource): AuditSnapshot {
    const snapshot: AuditSnapshot = {
        code: category.code,
        name: category.name,
        slug: category.slug,
        allowedAttributeValueIds: [...category.allowedAttributeValueIds].sort(),
    }

    const translations = [...(category.translations ?? [])].sort((left, right) =>
        left.locale < right.locale ? -1 : left.locale > right.locale ? 1 : 0,
    )

    for (const translation of translations) {
        const mirrorsLegacyColumns = translation.locale === DEFAULT_LOCALE

        if (!mirrorsLegacyColumns || translation.name !== category.name) {
            snapshot[`translations.${translation.locale}.name`] = translation.name
        }
        if (!mirrorsLegacyColumns || translation.slug !== category.slug) {
            snapshot[`translations.${translation.locale}.slug`] = translation.slug
        }
    }

    return snapshot
}

/** Denetim listesinde kaydı tanıtan ad ("10 · Bakalit Tutamaklar"); silinen kategori için de okunur kalır. */
export function categoryAuditLabel(category: Pick<CategoryAuditSource, "code" | "name">) {
    return `${category.code} · ${category.name}`
}
