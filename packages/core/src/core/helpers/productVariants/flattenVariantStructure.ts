/**
 * Varyantın yeni ilişki yapısını (`size` + `version`) ESKİ DÜZ DTO şekline çevirir:
 * `measurements`, `color`, `materials`.
 *
 * Neden: veri modelinde ölçüler ürün modeli başına tekilleştirilmiş
 * `ProductSize`/`ProductSizeValue`'ya, renk ve hammadde de `ProductVersion`'a taşındı.
 * Bunu okuyan yüzeyler (public katalog, portal, kampanya, özel fiyat, sipariş,
 * business request) ~50 dosyaya yayılmış durumda; hepsini aynı anda değiştirmek
 * yerine tek bir düzleştirici ile eski şekli koruyoruz.
 *
 * Saf modül: I/O yok, Prisma tipi yok — ham satır `any` alınır.
 * Çeviri farkındalığı olan sürüm için bkz. `products/mapPublicProductVariantTableRow.ts`.
 */

import { formatVersionCode } from "./variantCode"

export type FlatVariantMeasurement = {
    id: string
    value: number
    /** Ürün modeline özel ölçü etiketi — "Kol Çapı". */
    label: string
    unit: string | null
    measurementType: any
}

export type FlatVariantStructure = {
    /** Kodun 3. segmenti; eski `variantIndex`'in yerini alır. */
    sizeCode: number | null
    /** "V1" — eski `versionCode` ile aynı biçim. */
    versionCode: string | null
    colorId: string | null
    color: any
    materials: any[]
    measurements: FlatVariantMeasurement[]
}

export function flattenProductVariantStructure(variant: any): FlatVariantStructure {
    const sizeValues = variant?.size?.values ?? []

    return {
        sizeCode: variant?.size?.code ?? null,
        versionCode: variant?.version?.code ? formatVersionCode(variant.version.code) : null,
        colorId: variant?.version?.colorId ?? null,
        color: variant?.version?.color ?? null,
        materials: variant?.version?.materials ?? [],
        measurements: sizeValues.map((sizeValue: any) => ({
            id: sizeValue.id,
            value: sizeValue.value,
            label: sizeValue.requirement?.label ?? "",
            unit: sizeValue.requirement?.unit ?? sizeValue.requirement?.measurementType?.baseUnit ?? null,
            measurementType: sizeValue.requirement?.measurementType ?? null,
        })),
    }
}

/** Ham varyant satırını, eski alanları da taşıyan düz bir objeye genişletir. */
export function withFlatVariantStructure<T extends Record<string, any>>(variant: T): T & FlatVariantStructure {
    return { ...variant, ...flattenProductVariantStructure(variant) }
}
