/**
 * Ölçü kaydı (`ProductSize`) için tekilleştirme ve sıralama anahtarları.
 *
 * Kodun 3. segmenti ürün modeli içindeki ÖLÇÜ kodudur ve iki kural taşır:
 *  1. **Tekillik** — ZORUNLU ölçüleri aynı olan kayıtlar tek kod alır. `ProductSize`
 *     `buildRequiredSignature` ile tekilleştirilir; `buildSizeSignature` (tüm dolu
 *     değerler) yalnız tanısal karşılaştırma / eski çağrılar içindir. Opsiyonel bir
 *     ölçünün farklı olması ya da hiç girilmemesi ayrı kod ÜRETMEZ.
 *  2. **Küçükten büyüğe** — kodlar 1..N sırayla verilir. Bir ürün modelinde
 *     birden fazla ölçü olabildiği için (ör. "M4 + 10 cm") sıralama ÇOK
 *     ANAHTARLIDIR: ürün modelinin ölçü şablonundaki `sortPriority` sırasına göre
 *     önce birinci ölçü, eşitse ikinci, … karşılaştırılır. `sortKey` bunu tek bir
 *     sözlüksel olarak karşılaştırılabilir metne kodlar.
 *
 * Saf modül: I/O yok, Prisma yok.
 */

import { MEASUREMENT_VALUE_PRECISION, normalizeMeasurementValue } from "./measurementValue"

/** `ProductMeasurementRequirement`'ın anahtar üretimi için gereken alanları. */
export type MeasurementRequirementLike = {
    id: string
    /** `MeasurementType.code` — "R", "H1", "D" … */
    measurementCode: string
    /** Ürün modeline özel etiket — "Kol Çapı", "Burç Metriği". */
    label: string
    /** Ölçü kodu sıralamasında anahtar önceliği (küçük olan önce). */
    sortPriority: number
    /** Tablo kolon sırası — `sortPriority` eşitse ikincil ayraç. */
    displayOrder: number
    /**
     * Şablonda "zorunlu" işaretli mi? `buildRequiredSignature` YALNIZ bunlara bakar.
     * Alan verilmezse şablon varsayılanı gibi ZORUNLU kabul edilir (`@default(true)`).
     */
    isRequired?: boolean
}

export type SizeMeasurementValue = {
    requirementId: string
    value: number
    /** Bileşik girişte ("10*30") kullanıcının birebir yazdığı metin — bkz.
     * `ProductSizeValue.rawValue`. Doluysa imza bu metni kullanır, `value` yalnız
     * `buildSizeSortKey`'in sıralama matematiği içindir. */
    rawValue?: string | null
}

/**
 * Sıralama anahtarında negatif değerleri de sözlüksel olarak doğru sıralamak için
 * kullanılan kaydırma. Fiziksel ölçüler pratikte pozitiftir; açı gibi alanlar
 * negatif olabilsin diye simetrik bir aralık bırakıldı.
 */
export const SORT_KEY_VALUE_OFFSET = 100_000
const SORT_KEY_DIGITS = 10
const MISSING_VALUE_SEGMENT = `0${"0".repeat(SORT_KEY_DIGITS)}`

/**
 * Şablon sırası: `sortPriority` → `displayOrder` → kod → etiket → id.
 * Son iki ayraç yalnız determinizm içindir; aynı girdi her zaman aynı anahtarı
 * üretmelidir, yoksa tekilleştirme sessizce bozulur.
 */
export function orderMeasurementRequirements<T extends MeasurementRequirementLike>(
    requirements: readonly T[],
): T[] {
    return [...requirements].sort((left, right) => {
        if (left.sortPriority !== right.sortPriority) return left.sortPriority - right.sortPriority
        if (left.displayOrder !== right.displayOrder) return left.displayOrder - right.displayOrder

        const codeComparison = left.measurementCode.localeCompare(right.measurementCode)
        if (codeComparison !== 0) return codeComparison

        const labelComparison = left.label.localeCompare(right.label)
        if (labelComparison !== 0) return labelComparison

        return left.id.localeCompare(right.id)
    })
}

type LookupEntry = {
    value: number
    rawValue?: string | null
}

function buildValueLookup(
    values: readonly SizeMeasurementValue[],
    requirements: readonly MeasurementRequirementLike[],
): Map<string, LookupEntry> {
    const knownRequirementIds = new Set(requirements.map((requirement) => requirement.id))
    const lookup = new Map<string, LookupEntry>()

    for (const entry of values) {
        if (!knownRequirementIds.has(entry.requirementId)) {
            throw new RangeError(`measurement value references unknown requirement: ${entry.requirementId}`)
        }
        if (lookup.has(entry.requirementId)) {
            throw new RangeError(`duplicate measurement value for requirement: ${entry.requirementId}`)
        }
        lookup.set(entry.requirementId, {
            value: normalizeMeasurementValue(entry.value),
            rawValue: entry.rawValue,
        })
    }

    return lookup
}

/** İmza segmentindeki `=DEĞER` kısmı: bileşik girişte birebir metin, aksi halde sabit ondalıklı sayı. */
function formatSignatureValue(entry: LookupEntry): string {
    return entry.rawValue ? entry.rawValue : entry.value.toFixed(MEASUREMENT_VALUE_PRECISION)
}

/**
 * Ölçünün tekilleştirme anahtarı — "R#Kol Çapı=20.0000|H1#Kol Yüksekliği=40.0000".
 *
 * Yalnız DOLU değerler girer: opsiyonel bir ölçüsü olan ölçü kaydı, o ölçüsü
 * olmayandan farklıdır ve ayrı kod alır.
 */
export function buildSizeSignature(
    values: readonly SizeMeasurementValue[],
    requirements: readonly MeasurementRequirementLike[],
): string {
    const lookup = buildValueLookup(values, requirements)
    if (lookup.size === 0) {
        throw new RangeError("size must carry at least one measurement value")
    }

    return orderMeasurementRequirements(requirements)
        .filter((requirement) => lookup.has(requirement.id))
        .map((requirement) => {
            const entry = lookup.get(requirement.id) as LookupEntry
            return `${requirement.measurementCode}#${requirement.label}=${formatSignatureValue(entry)}`
        })
        .join("|")
}

/**
 * Ölçü kaydının ZORUNLU ölçülerinden türeyen imza — "R#Elcik Çapı=20.0000|D#Burç
 * Metriği=5.0000|H1#Elcik Yüksekliği=16.0000".
 *
 * `ProductSize` bu anahtarla tekilleştirilir: zorunlu ölçüleri aynı olan varyantlar
 * — opsiyonel bir ölçüsü farklı olsa ya da hiç girilmese bile — TEK ölçü kodunu
 * paylaşır (`1.23.1.V1.A` / `.B` / `.C`). Opsiyonel ölçü değerleri yine
 * `ProductSizeValue`'da tutulur ama kodun 3. segmentini belirlemez.
 *
 * Şablonda hiç zorunlu ölçü yoksa boş string döner — o modelin tüm varyantları tek
 * gruba düşer (public özet tablosu da zaten zorunlu ölçüyle grupluyor).
 */
export function buildRequiredSignature(
    values: readonly SizeMeasurementValue[],
    requirements: readonly MeasurementRequirementLike[],
): string {
    const lookup = buildValueLookup(values, requirements)

    return orderMeasurementRequirements(requirements)
        .filter((requirement) => requirement.isRequired !== false && lookup.has(requirement.id))
        .map((requirement) => {
            const entry = lookup.get(requirement.id) as LookupEntry
            return `${requirement.measurementCode}#${requirement.label}=${formatSignatureValue(entry)}`
        })
        .join("|")
}

/**
 * Sözlüksel olarak karşılaştırıldığında ölçüleri küçükten büyüğe sıralayan anahtar.
 *
 * Her ölçü için sabit genişlikte bir segment üretilir; segment "1" ile başlıyorsa
 * değer var, "0" ile başlıyorsa yok. Böylece eksik ölçü her zaman dolu olandan
 * ÖNCE gelir ve farklı ölçü sayısına sahip kayıtlar kararlı biçimde sıralanır.
 */
export function buildSizeSortKey(
    values: readonly SizeMeasurementValue[],
    requirements: readonly MeasurementRequirementLike[],
): string {
    const lookup = buildValueLookup(values, requirements)

    return orderMeasurementRequirements(requirements)
        .map((requirement) => {
            const entry = lookup.get(requirement.id)
            if (entry === undefined) return MISSING_VALUE_SEGMENT

            const value = entry.value
            if (Math.abs(value) > SORT_KEY_VALUE_OFFSET) {
                throw new RangeError(
                    `measurement value out of sortable range (±${SORT_KEY_VALUE_OFFSET}): ${value}`,
                )
            }

            const scaled = Math.round((value + SORT_KEY_VALUE_OFFSET) * 10 ** MEASUREMENT_VALUE_PRECISION)
            return `1${String(scaled).padStart(SORT_KEY_DIGITS, "0")}`
        })
        .join("|")
}

export type SizeKeyLike = {
    sortKey: string
    signature: string
}

/**
 * Ölçü kaydı karşılaştırıcısı. `sortKey` eşitse `signature` ayırır — iki farklı
 * ölçünün aynı sıraya düşüp numaralandırmayı belirsizleştirmesini engeller.
 */
export function compareSizeKeys(left: SizeKeyLike, right: SizeKeyLike): number {
    if (left.sortKey !== right.sortKey) return left.sortKey < right.sortKey ? -1 : 1
    if (left.signature !== right.signature) return left.signature < right.signature ? -1 : 1
    return 0
}
