import type {
    ProductFormValues,
    ProductIndustrialUsageFormValues,
    ProductTranslationFormValues,
} from "@/features/admin/products/schema/productFormSchema"

/**
 * Form değerlerini API gövdesine çeviren ortak yardımcılar.
 * createProduct ve updateProduct aynı kuralları uygulamak zorunda; iki ayrı
 * kopya tutulduğunda biri güncellenip diğeri unutulabiliyordu.
 */

/**
 * `imageUrl` yalnız client-side önizleme alanıdır (hem satır hem çeviri
 * seviyesinde) — backend'e gönderilmez, kaynak gerçek `imageKey`'dir.
 */
export function serializeIndustrialUsages(industrialUsages?: ProductIndustrialUsageFormValues[]) {
    return industrialUsages?.map(({ imageUrl, translations, ...row }) => ({
        ...row,
        translations: translations?.map(({ imageUrl: _translationImageUrl, ...translation }) => translation),
    }))
}

/** Boş bırakılmış hedef-dil çevirilerini göndermez; TR her zaman taşınır. */
export function serializeTranslations(translations?: ProductTranslationFormValues[]) {
    return translations?.filter((translation) =>
        translation.locale === "tr" || Boolean(translation.name?.trim())
    )
}

/**
 * Üç durumu ayırır:
 *  - `undefined` → alan gönderilmedi, backend kolona DOKUNMAMALI
 *  - boş/whitespace → kullanıcı temizledi, kolon null'a çekilmeli
 *  - dolu → trim'lenmiş değer
 *
 * `undefined` dönüşü kritik: JSON.stringify undefined anahtarları atar, böylece
 * kısmi (dirty-only) gövdelerde gönderilmeyen video alanı yanlışlıkla silinmez.
 */
export function serializeVideoUrl(value?: string | null) {
    if (value === undefined) return undefined
    return value?.trim() ? value.trim() : null
}

/**
 * Yalnız RHF'in kirli (dirty) olarak işaretlediği alanları taşır.
 * Handler gönderilmeyen alan için hiç iş yapmıyor: video-only bir düzenleme
 * artık çeviri upsert'ine, industrialUsages normalizasyonuna veya attribute
 * doğrulamasına hiç girmiyor.
 *
 * Diziler (attributeValueIds, industrialUsages, translations) kısmi
 * gönderilemez — içlerinde bir şey değiştiyse dizinin tamamı taşınır.
 */
function pickDirtyProductFields(
    data: ProductFormValues,
    dirtyFields: Partial<Record<keyof ProductFormValues, unknown>>,
): Partial<ProductFormValues> {
    const payload: Partial<ProductFormValues> = {}

    if (dirtyFields.code) payload.code = data.code
    if (dirtyFields.name) payload.name = data.name
    if (dirtyFields.description) payload.description = data.description
    if (dirtyFields.categoryId) payload.categoryId = data.categoryId
    if (dirtyFields.assemblyVideoUrl) payload.assemblyVideoUrl = data.assemblyVideoUrl
    if (dirtyFields.promoVideoUrl) payload.promoVideoUrl = data.promoVideoUrl
    if (dirtyFields.attributeValueIds) payload.attributeValueIds = data.attributeValueIds
    if (dirtyFields.industrialUsages) payload.industrialUsages = data.industrialUsages
    if (dirtyFields.translations) payload.translations = data.translations

    return payload
}

/**
 * Update isteğinin gövdesi: mümkünse yalnız kirli alanlar.
 *
 * GÜVENLİK AĞI: hiçbir alan kirli görünmüyorsa TÜM veri gönderilir. Kirli-alan
 * takibi bir kez sessizce boş kalmıştı (RHF `formState` bir Proxy'dir; alan yalnız
 * callback içinde okunursa abonelik kurulmaz ve `dirtyFields` boş kalır) — sonuç
 * 200 dönen ama hiçbir şeyi değiştirmeyen bir istekti. Kullanıcının düzenlemesini
 * sessizce yutmak, optimizasyonu kaçırmaktan çok daha kötü.
 */
export function buildProductUpdatePayload(
    data: ProductFormValues,
    dirtyFields: Partial<Record<keyof ProductFormValues, unknown>>,
): Partial<ProductFormValues> {
    const dirtyPayload = pickDirtyProductFields(data, dirtyFields)

    return Object.keys(dirtyPayload).length > 0 ? dirtyPayload : data
}
