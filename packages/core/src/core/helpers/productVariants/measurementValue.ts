/**
 * Ölçü değeri ayrıştırma ve normalizasyonu — TEK KAYNAK.
 *
 * Daha önce yalnız frontend'de yaşıyordu (`CreateVariantDialog.tsx`), bu yüzden
 * sunucu tarafı aynı girdiyi farklı yorumlayabiliyordu. Artık matris ekranı da
 * matris endpoint'i de bu modülü kullanır.
 *
 * İki yorum var:
 *  - **Metrik diş** kodları (`M`, `D`): "M4", "M 12", "4" hepsi 4 sayısına ve
 *    "M4" etiketine çözülür. `MeasurementCode` yorumlarında `D` "Metrik (D)"
 *    olarak tanımlı, bu yüzden `M` ile aynı davranır — mevcut davranış birebir
 *    korunmuştur.
 *  - **Diğer kodlar**: ondalık ayırıcı olarak hem "." hem "," kabul edilir
 *    ("12,5" → 12.5), etiket kullanıcının yazdığı gibi kalır.
 */

/** Metrik diş olarak yorumlanan `MeasurementCode` değerleri. */
export const METRIC_THREAD_MEASUREMENT_CODES = ["D", "M"] as const

/**
 * Ölçü değerlerinin saklandığı/karşılaştırıldığı ondalık hassasiyeti.
 * Tekilleştirme anahtarı (bkz. sizeSignature.ts) bu hassasiyette üretilir;
 * kayan nokta gürültüsü yüzünden aynı ölçünün iki kez kod almasını engeller.
 */
export const MEASUREMENT_VALUE_PRECISION = 4

const METRIC_THREAD_PATTERN = /^M?\s*(\d+(?:[.,]\d+)?)$/i

export type ParsedMeasurementValue = {
    value: number
    normalizedLabel: string
}

export function isMetricThreadMeasurementCode(measurementCode?: string | null): boolean {
    if (!measurementCode) return false
    return (METRIC_THREAD_MEASUREMENT_CODES as readonly string[]).includes(measurementCode)
}

/** Kayan nokta gürültüsünü ayıklar: 0.1 + 0.2 → 0.3. */
export function normalizeMeasurementValue(value: number): number {
    if (!Number.isFinite(value)) {
        throw new RangeError(`measurement value must be finite, received: ${value}`)
    }
    const factor = 10 ** MEASUREMENT_VALUE_PRECISION
    return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Kullanıcı girdisini ölçü değerine çevirir. Geçersizse `null` — çağıran taraf
 * kendi hata mesajını üretir (UI'da alan hatası, API'de 400).
 */
export function parseMeasurementInput(
    rawValue: string,
    measurementCode?: string | null,
): ParsedMeasurementValue | null {
    const normalized = rawValue.trim()
    if (!normalized) return null

    if (isMetricThreadMeasurementCode(measurementCode)) {
        const match = normalized.match(METRIC_THREAD_PATTERN)
        if (!match) return null

        const numericValue = Number(match[1].replace(",", "."))
        if (!Number.isFinite(numericValue)) return null

        // Etiket her iki dalda da AYNI biçimde üretilir ("M4.5"): frontend'deki
        // özgün uygulama "M" ile başlayan girdide virgülü koruyup başlamayanda
        // noktaya çeviriyordu, bu da aynı dişin iki farklı etiketle saklanmasına
        // yol açıyordu.
        return {
            value: normalizeMeasurementValue(numericValue),
            normalizedLabel: `M${match[1].replace(",", ".")}`,
        }
    }

    const numericValue = Number(normalized.replace(",", "."))
    if (!Number.isFinite(numericValue)) return null

    return {
        value: normalizeMeasurementValue(numericValue),
        normalizedLabel: normalized,
    }
}
