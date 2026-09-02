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
            isRequired?: boolean
            measurementType: { id: string; displayOrder?: number } | null
        } | null
    }>
}

function buildSizeKey(size: SizeRowLike, requiredOnly: boolean): string {
    // `buildMeasurementKey` yalnız `value` ve `measurementType`'ı okur;
    // id/label anahtara girmez (etiket çevrilebilir olduğu için bilinçli).
    const values = requiredOnly
        ? size.values.filter((value) => value.requirement?.isRequired !== false)
        : size.values
    return buildMeasurementKey(
        values.map((value) => ({
            id: "",
            label: "",
            value: value.value,
            measurementType: value.requirement?.measurementType,
        })),
    )
}

export function resolveSizeIdByMeasurementKey(
    sizes: readonly SizeRowLike[],
    measurementKey: string,
): string | null {
    if (!measurementKey) return null
    for (const size of sizes) {
        if (buildSizeKey(size, false) === measurementKey) return size.id
    }
    return null
}

/**
 * Anahtarla EŞLEŞEN TÜM ölçü id'leri.
 *
 * Public/portal özet tablosunun anahtarı yalnız ZORUNLU ölçülerden kurulur
 * (bkz. `groupVariantTableRows`), bu yüzden tek bir grup satırı birden çok
 * `ProductSize`'a karşılık gelebilir — opsiyonel ölçüsü girilmiş ve girilmemiş
 * versiyonlar. "Varyantları Göster" drill-down'ı hepsinin varyantlarını
 * göstermeli, yoksa deduplike satırın altında varyant kaybolur.
 *
 * Bir ölçü, zorunlu-ölçü anahtarı VEYA tüm-ölçü anahtarı gelen değerle eşleşirse
 * dahil edilir; ikinci koşul dışarı çıkmış eski `?m=` bağlantılarını (tüm
 * ölçülerle üretilmiş anahtar) da çalışır tutar.
 */
export function resolveSizeIdsByMeasurementKey(
    sizes: readonly SizeRowLike[],
    measurementKey: string,
): string[] {
    if (!measurementKey) return []
    return sizes
        .filter(
            (size) =>
                buildSizeKey(size, true) === measurementKey ||
                buildSizeKey(size, false) === measurementKey,
        )
        .map((size) => size.id)
}
