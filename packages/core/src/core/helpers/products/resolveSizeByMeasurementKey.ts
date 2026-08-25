import { buildMeasurementKey } from "@/core/helpers/productVariants/measurementDisplay"

/**
 * URL'deki ölçü anahtarını (`?m=`) `ProductSize.id`'ye çözer.
 *
 * Neden anahtar üzerinden: `?m=` 16 yerde link kuruluyor (3D konfigüratör ve
 * atanmış-varyant kartları dahil) ve dışarı çıkmış bağlantılarda geçiyor. Ölçü
 * koduna geçmek hepsini dolaşmayı gerektirirdi; sunucu anahtarı kabul edince
 * link kuran hiçbir yer değişmiyor.
 *
 * Arama ÖLÇÜLER üzerinde yapılır (ürün başına onlarca kayıt), varyantlar üzerinde
 * değil (binlerce olabilir) — bu yüzden ucuzdur.
 *
 * Anahtar `buildMeasurementKey` ile kurulur; burada FORMAT YENİDEN YAZILMAZ,
 * aynı core fonksiyonu çağrılır. Aksi hâlde istemcinin ürettiği anahtarla
 * sunucunun beklediği sessizce ayrışırdı.
 */

type SizeRowLike = {
    id: string
    values: Array<{
        value: number
        requirement: {
            measurementType: { id: string; displayOrder?: number } | null
        } | null
    }>
}

export function resolveSizeIdByMeasurementKey(
    sizes: readonly SizeRowLike[],
    measurementKey: string,
): string | null {
    if (!measurementKey) return null

    for (const size of sizes) {
        // `buildMeasurementKey` yalnız `value` ve `measurementType`'ı okur;
        // id/label anahtara girmez (etiket çevrilebilir olduğu için bilinçli).
        const key = buildMeasurementKey(
            size.values.map((value) => ({
                id: "",
                label: "",
                value: value.value,
                measurementType: value.requirement?.measurementType,
            })),
        )
        if (key === measurementKey) return size.id
    }

    return null
}
