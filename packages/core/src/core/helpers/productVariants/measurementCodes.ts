/**
 * Ölçü tipi KODLARI (`MeasurementCode` Prisma enum'u) — TEK KAYNAK.
 *
 * Saf modül — hiçbir import YOK: frontend bu dosyayı `@core/helpers/productVariants/measurementCodes`
 * alias'ıyla içe alır (Prisma'nın ürettiği enum frontend'e taşınamaz). `measurementCodes.test.ts`
 * listenin `schema.prisma`'daki enum ile birebir aynı olduğunu doğrular: şemaya eklenip buraya
 * eklenmeyen (ya da tersi) bir kod testi düşürür.
 *
 * Daha önce aynı liste 7 dosyada elle kopyalanıyordu (validator, liste filtresi, form, tipler);
 * R3/H3 eklenirken 9 yere tek tek eklenmişti.
 */
export const MEASUREMENT_CODES = [
    "D",
    "D1",
    "D2",
    "R",
    "R1",
    "R2",
    "R3",
    "L",
    "L1",
    "L2",
    "T",
    "A",
    "W",
    "H",
    "H1",
    "H2",
    "H3",
    "PT",
    "M",
    "R_L",
    "P_T",
    "W_L",
] as const

export type MeasurementCodeValue = (typeof MEASUREMENT_CODES)[number]

export function isMeasurementCode(value: unknown): value is MeasurementCodeValue {
    return typeof value === "string" && (MEASUREMENT_CODES as readonly string[]).includes(value)
}

/**
 * Kodun EKRANDAKİ hâli. Enum adında tire kullanılamadığı için iki ölçülü kodlar alt çizgiyle
 * saklanır ("R_L"); kullanıcıya "R-L" gösterilir.
 *
 * Yalnız GÖSTERİM içindir: ölçü imzası, `?m=` anahtarı, sepet anahtarı ve API değeri ham kodu
 * kullanmaya devam eder — onları bununla kurmak dışarı çıkmış bağlantıları ve kayıtlı
 * anahtarları bozar.
 */
export function formatMeasurementCode(code: string | null | undefined): string {
    return code ? code.replace(/_/g, "-") : ""
}

/**
 * Serbest arama metniyle eşleşen kodlar — ham ("R_L") ve ekrandaki ("R-L") biçimiyle, büyük /
 * küçük harf duyarsız. Kod bir ENUM kolonudur ve Prisma enum'da `contains` YOKTUR: listeleme
 * aramayı `code: { in: … }` olarak bu fonksiyonun sonucuyla kurar.
 */
export function findMeasurementCodesMatching(search: string | null | undefined): MeasurementCodeValue[] {
    const needle = search?.trim().toLowerCase()
    if (!needle) return []

    return MEASUREMENT_CODES.filter(
        (code) => code.toLowerCase().includes(needle) || formatMeasurementCode(code).toLowerCase().includes(needle),
    )
}
