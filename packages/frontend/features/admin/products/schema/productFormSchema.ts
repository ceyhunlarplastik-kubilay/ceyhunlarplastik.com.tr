import { z } from "zod"
import { extractYoutubeVideoId } from "@core/helpers/products/youtubeVideo"
import {
    ADMIN_DEFAULT_LOCALE,
    ADMIN_LOCALES,
    ADMIN_TARGET_LOCALES,
    adminTranslationIndex,
    isAdminLocale,
    type AdminLocale,
} from "@/features/admin/shared/translations/adminLocales"

/**
 * Ürün formunun çeviri yüzeyi — dil listesi paylaşılan admin modülünden,
 * o da `@core/i18n/locales`'ten türer. Yeni bir dil eklemek yalnız core
 * listesine bir kod eklemektir; buradaki hiçbir şey değişmez.
 *
 * Bu yeniden dışa aktarımlar, ürün dialog'larının çeviri bileşenleriyle
 * uyumunu bozmadan tek kaynağa bağlanabilmesi için duruyor.
 */
export const PRODUCT_FORM_LOCALES = ADMIN_LOCALES
export type ProductFormLocale = AdminLocale

export const PRODUCT_FORM_DEFAULT_LOCALE = ADMIN_DEFAULT_LOCALE
export const PRODUCT_FORM_TARGET_LOCALES = ADMIN_TARGET_LOCALES

/** Varsayılan dil dışındaki bir locale'in `translations` dizisindeki sabit indeksi. */
export const productTranslationIndex = adminTranslationIndex

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
export const isProductFormLocale = isAdminLocale
export type ProductIndustrialUsageFormValues = z.infer<typeof productIndustrialUsageFormSchema>;
export type ProductTranslationFormValues = z.infer<typeof productTranslationFormSchema>;
