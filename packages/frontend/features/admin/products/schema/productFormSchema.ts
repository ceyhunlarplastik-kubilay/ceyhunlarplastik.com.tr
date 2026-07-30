import { z } from "zod"
import { extractYoutubeVideoId } from "@core/helpers/products/youtubeVideo"

/**
 * Admin formlarının çeviri yüzeyi için TEK kaynak.
 *
 * Yeni bir dil eklemek: buraya bir kod ekle (+ backend'de
 * AdminApi/validators/products.ts ve core/i18n/locales.ts). Dialog'lar,
 * locale sekmeleri ve endüstriyel kullanım editörü bu listeden türediği için
 * arayüz tarafında başka hiçbir yeri değiştirmek gerekmez.
 *
 * `TARGET` = varsayılan dışındaki diller. Sırası SABİT olmalı: RHF
 * `translations.<index>.<field>` yollarıyla çalışıyor, index bu sıradan geliyor.
 */
export const PRODUCT_FORM_LOCALES = ["tr", "en"] as const
export type ProductFormLocale = (typeof PRODUCT_FORM_LOCALES)[number]

export const PRODUCT_FORM_DEFAULT_LOCALE: ProductFormLocale = "tr"

export const PRODUCT_FORM_TARGET_LOCALES: ProductFormLocale[] = PRODUCT_FORM_LOCALES.filter(
    (locale) => locale !== PRODUCT_FORM_DEFAULT_LOCALE,
)

export const PRODUCT_FORM_LOCALE_LABELS: Record<ProductFormLocale, string> = {
    tr: "Türkçe",
    en: "İngilizce",
}

/** Dil seçicideki bayraklar — LanguageSwitcher ile aynı görsel dil. */
export const PRODUCT_FORM_LOCALE_FLAGS: Record<ProductFormLocale, string> = {
    tr: "🇹🇷",
    en: "🇬🇧",
}

/** Varsayılan dil dışındaki bir locale'in `translations` dizisindeki sabit indeksi. */
export function productTranslationIndex(locale: ProductFormLocale) {
    return PRODUCT_FORM_TARGET_LOCALES.indexOf(locale)
}

const productFormLocaleSchema = z.enum(PRODUCT_FORM_LOCALES)

// Backend de aynı parser'ı kullanır (normalizeProductVideoUrls); buradaki kontrol
// kullanıcıya form üzerinde anında geri bildirim vermek içindir.
const productVideoUrlFormSchema = z
    .string()
    .trim()
    .max(512)
    .optional()
    .refine((value) => !value || extractYoutubeVideoId(value) !== null, {
        message: "Geçerli bir YouTube video linki girin",
    })

export const productIndustrialUsageFormSchema = z.object({
    id: z.uuid().nullable().optional(),
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    usageAreaValueId: z.uuid().nullable().optional(),
    usageFunction: z.string().max(2000).nullable().optional(),
    translations: z.array(z.object({
        locale: productFormLocaleSchema,
        usageFunction: z.string().max(2000).nullable().optional(),
        // Locale'e özgü görsel. imageUrl yalnız önizleme içindir, submit'te ayıklanır.
        imageKey: z.string().max(2048).nullable().optional(),
        imageUrl: z.string().nullable().optional(),
    })).optional(),
    // Varsayılan (TR) görsel.
    imageKey: z.string().max(2048).nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    displayOrder: z.number().int().min(0).nullable().optional(),
})

export const productTranslationFormSchema = z.object({
    locale: productFormLocaleSchema,
    name: z.string().max(255).nullable().optional(),
    slug: z.string().max(255).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
})

export const productFormSchema = z.object({
    name: z.string().min(2, "Ürün adı zorunlu"),
    code: z.string().min(1, "Kod zorunlu"),
    description: z.string().max(500).optional(),
    categoryId: z.uuid().min(1, "Kategori seçmelisiniz"),
    assemblyVideoUrl: productVideoUrlFormSchema,
    promoVideoUrl: productVideoUrlFormSchema,
    attributeValueIds: z.array(z.uuid()).optional(),
    industrialUsages: z.array(productIndustrialUsageFormSchema).optional(),
    translations: z.array(productTranslationFormSchema).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * `translations` default'unu hedef dillerin SABİT sırasında kurar.
 *
 * Dizi her zaman her hedef dil için bir girdi taşır (boş olsalar bile) —
 * `productTranslationIndex` ile hesaplanan RHF yollarının
 * (`translations.<index>.name`) doğru girdiye denk gelmesi buna bağlı.
 * Boş kalan hedef diller gönderim sırasında serializeTranslations tarafından atılır.
 */
export function buildProductTranslationDefaults(
    existing?: Array<{
        locale: string
        name?: string | null
        slug?: string | null
        description?: string | null
    }>,
): ProductTranslationFormValues[] {
    return PRODUCT_FORM_TARGET_LOCALES.map((locale) => {
        const match = existing?.find((translation) => translation.locale === locale)

        return {
            locale,
            name: match?.name ?? "",
            slug: match?.slug ?? "",
            description: match?.description ?? "",
        }
    })
}

/** Bir locale kodu admin formunun desteklediği diller arasında mı? */
export function isProductFormLocale(value: string): value is ProductFormLocale {
    return (PRODUCT_FORM_LOCALES as readonly string[]).includes(value)
}
export type ProductIndustrialUsageFormValues = z.infer<typeof productIndustrialUsageFormSchema>;
export type ProductTranslationFormValues = z.infer<typeof productTranslationFormSchema>;
