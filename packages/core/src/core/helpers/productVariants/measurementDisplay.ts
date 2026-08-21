/**
 * Ölçü GÖSTERİM kuralları — değer metni, görünen ad, birim.
 *
 * Core'da yaşar çünkü public katalog, müşteri portalı ve admin yüzeyleri aynı
 * kuralı uygular. Daha önce her yüzey kendi kopyasını taşıyordu ve hiçbiri
 * şablondaki birim ezmesini (`unit`) bilmiyordu: operatör "cm" tanımlasa bile
 * ekranda ölçü tipinin taban birimi "mm" görünüyordu.
 */

export type MeasurementDisplayInput = {
    id: string
    value: number
    /** Ürün modeline özel ölçü ADI ("Elcik Çapı") — değer metni DEĞİL. */
    label: string
    /** Şablonda ezilmiş birim; yoksa ölçü tipinin taban birimi. */
    unit?: string | null
    // Alanlar GEVŞEK: bu yardımcıyı public katalog, portal ve admin farklı DTO
    // şekilleriyle çağırıyor; gösterim kuralı eksik alana tolerans göstermeli.
    measurementType?: {
        id?: string
        name?: string
        code?: string
        baseUnit?: string | null
        displayOrder?: number
    } | null
}

/** D ve M kodları metrik diş olarak okunur: 4 → "M4". */
const METRIC_THREAD_CODES = ["D", "M"]

function normalizeNumeric(value: number): string {
    if (!Number.isFinite(value)) return String(value)
    return Number.parseFloat(value.toFixed(6)).toString()
}

/**
 * Ölçünün DEĞER metni.
 *
 * DİKKAT: eskiden `measurement.label` değer metni sanılıyordu ("M4" oraya
 * yazılıyordu). Yeni veri modelinde `label` ürün modeline özel ölçü ADIDIR
 * ("Burç Metriği"); değer yalnız `value`'dan üretilir. Eski hâli public katalogda
 * değerin yerine ölçü adını basardı.
 */
export function formatMeasurementValue(measurement: MeasurementDisplayInput): string {
    const numeric = normalizeNumeric(measurement.value)
    const code = measurement.measurementType?.code

    if (code && METRIC_THREAD_CODES.includes(code)) return `M${numeric}`
    return numeric
}

/** Ölçünün görünen adı: ürün modeline özel etiket, yoksa ölçü tipinin adı. */
export function resolveMeasurementName(measurement: MeasurementDisplayInput): string {
    return measurement.label?.trim() || measurement.measurementType?.name || ""
}

/** Birim yalnız metrik diş OLMAYAN ölçülerde gösterilir ("M4 mm" anlamsız olurdu). */
export function resolveMeasurementUnit(measurement: MeasurementDisplayInput): string | null {
    const code = measurement.measurementType?.code
    if (code && METRIC_THREAD_CODES.includes(code)) return null
    return measurement.unit ?? measurement.measurementType?.baseUnit ?? null
}

function byDisplayOrder(a: MeasurementDisplayInput, b: MeasurementDisplayInput) {
    return (a.measurementType?.displayOrder ?? 0) - (b.measurementType?.displayOrder ?? 0)
}

/**
 * Ölçü setinin URL anahtarı.
 *
 * Ölçü TİPİ id'si ve değer kullanılır — etiket KULLANILMAZ. Etiket çevrilebilir
 * olduğu için anahtara girseydi dil değişince seçim sıfırlanırdı (daha önce
 * yaşanmış bir hata; bkz. IMPROVEMENT_PLAN "Varyantlar sayfası i18n bug'ı").
 */
export function buildMeasurementKey(measurements: MeasurementDisplayInput[]): string {
    return [...measurements]
        .sort(byDisplayOrder)
        .map((measurement) => `${measurement.measurementType?.id ?? ""}:${normalizeNumeric(measurement.value)}`)
        .join("|")
}

/** Görünen özet: "Elcik Çapı: 20 cm · Burç Metriği: M4" */
export function toMeasurementLabel(measurements: MeasurementDisplayInput[]): string {
    return [...measurements]
        .sort(byDisplayOrder)
        .map((measurement) => {
            const unit = resolveMeasurementUnit(measurement)
            const value = formatMeasurementValue(measurement)
            return `${resolveMeasurementName(measurement)}: ${value}${unit ? ` ${unit}` : ""}`
        })
        .join(" · ")
}
