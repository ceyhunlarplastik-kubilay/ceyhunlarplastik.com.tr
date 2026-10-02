/**
 * Ölçü değeri ayrıştırma ve normalizasyonu — TEK KAYNAK.
 *
 * Daha önce yalnız frontend'de yaşıyordu (`CreateVariantDialog.tsx`), bu yüzden
 * sunucu tarafı aynı girdiyi farklı yorumlayabiliyordu. Artık matris ekranı da
 * matris endpoint'i de bu modülü kullanır.
 *
 * Üç yorum var:
 *  - **Metrik diş** kodları (`M`, `D`): "M4", "M 12", "4" hepsi 4 sayısına ve
 *    "M4" etiketine çözülür. `MeasurementCode` yorumlarında `D` "Metrik (D)"
 *    olarak tanımlı, bu yüzden `M` ile aynı davranır — mevcut davranış birebir
 *    korunmuştur.
 *  - **Bileşik ölçü** ("10*30", "10x30", "10×30", "10/30", "10-30"): tek sayıya
 *    indirgenemeyen ölçüler için. Metrik diş kodlarında geçersizdir (üstteki dal
 *    önce çalışır). `value` yalnız SIRALAMA SÜRROGATI olarak ilk sayıyı taşır;
 *    metin `rawValue`'da saklanır (bkz. `ProductSizeValue.rawValue`). Ayraç
 *    YAZILDIĞI GİBİ korunur — "x" / "×" yalnız yazım farkı olduğu için "*" olur,
 *    "/" ve "-" kalır: 10-30 bir aralık, 10*30 bir boyut olabilir, ikisi ayrı
 *    ölçü kodu alır (kullanıcı kararı, 2026-10-02).
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
/** "10*30", "10x30", "10×30", "10/30", "10-30" — ayraçtan önce/sonra boşluk serbest. */
const COMPOUND_INPUT_PATTERN = /^(\d+(?:[.,]\d+)?)\s*([x×*/-])\s*(\d+(?:[.,]\d+)?)$/i

/**
 * Saklanan `rawValue`'nun biçimi — `parseMeasurementInput` YALNIZ bunu üretir: ondalık
 * ayırıcı ".", boşluk yok, ayraç "*", "/" ya da "-" ("10*30", "5.5/105", "10-30").
 *
 * Tek kaynak: AdminApi istek validator'ları (`z.string().regex(…)` → JSON Schema `pattern`)
 * ve tedarikçi varyant talebinin onayı bu deseni kullanır. Desen ajv'de `u` bayrağıyla
 * derlenir; değiştirirken Unicode kipinde de geçerli kalmasına dikkat et
 * (`validatorCompilation.test.ts` derler).
 */
export const COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN = /^\d+(?:\.\d+)?[*/-]\d+(?:\.\d+)?$/

export function isCompoundMeasurementRawValue(value: unknown): value is string {
    return typeof value === "string" && COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN.test(value)
}

/** "x" ve "×" çarpımın yazım biçimleridir → "*". "/" ve "-" anlam taşıyabilir, korunur. */
function canonicalCompoundSeparator(separator: string): "*" | "/" | "-" {
    if (separator === "/" || separator === "-") return separator
    return "*"
}

export type ParsedMeasurementValue = {
    value: number
    normalizedLabel: string
    /** Yalnız bileşik girişte dolu — `COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN` biçiminde
     * ("10x30" → "10*30", "10 / 30" → "10/30", "10-30" → "10-30"). Düz sayısal/metrik
     * diş girişte yok. */
    rawValue?: string
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

    const compoundMatch = normalized.match(COMPOUND_INPUT_PATTERN)
    if (compoundMatch) {
        const firstText = compoundMatch[1].replace(",", ".")
        const secondText = compoundMatch[3].replace(",", ".")
        const first = Number(firstText)
        const second = Number(secondText)
        if (!Number.isFinite(first) || !Number.isFinite(second)) return null

        const rawValue = `${firstText}${canonicalCompoundSeparator(compoundMatch[2])}${secondText}`
        return {
            value: normalizeMeasurementValue(first),
            normalizedLabel: rawValue,
            rawValue,
        }
    }

    const numericValue = Number(normalized.replace(",", "."))
    if (!Number.isFinite(numericValue)) return null

    return {
        value: normalizeMeasurementValue(numericValue),
        normalizedLabel: normalized,
    }
}
