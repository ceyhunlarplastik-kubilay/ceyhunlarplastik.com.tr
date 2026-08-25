// Göreli import BİLİNÇLİ: bu modülün TİPİ frontend'den de okunuyor
// (`features/public/products/utils/groupedMeasurementOption.ts`) ve frontend
// tsconfig'i core'un `@/core/*` alias'ını çözemiyor (yalnız `@core/*` var).
import {
    buildMeasurementKey,
    toMeasurementLabel,
    type MeasurementDisplayInput,
} from "../productVariants/measurementDisplay"

/**
 * Varyant tablosunun SATIRI = ÖLÇÜ.
 *
 * Ekran ham varyant listelemez: aynı fiziksel ölçünün tüm versiyonları (renk +
 * hammadde) tek satırda toplanır, renk/hammadde o satırda çoğul gösterilir.
 * 40 ölçü × 20 versiyon = 800 varyant → ekranda 40 satır.
 *
 * Bu gruplama daha önce frontend'de (`groupVariantMeasurements.ts`, RSC sayfa
 * katmanı) yapılıyordu ve sunucu ham varyantları sayfalıyordu — yani sayfalama
 * YANLIŞ BİRİM üzerindeydi: 500 varyant sınırı, ekranda kaç satır göreceğinizle
 * ilgisiz bir yerde kesiyordu ve fazlası sessizce düşüyordu. Gruplama sunucuya
 * inince sayfalama da doğru birime (ölçüye) oturdu.
 *
 * `suppliers` BİLİNÇLİ olarak boş bırakılır — bkz. alan yorumu.
 */

export type GroupedVariantRow = {
    /** URL anahtarı (`?m=`) — ölçü tipi id'si + değer, etiket DEĞİL (dil değişince kaymasın). */
    key: string
    /** "Elcik Çapı: 20 cm · Burç Metriği: M4" */
    label: string
    measurements: any[]
    colors: any[]
    materials: any[]
    /**
     * P1.8(B0)'dan beri HER ZAMAN boş: ne public ne portal DTO'su tedarikçi
     * kimliği taşıyor (public'te `variantSuppliers` hiç yok, portalda yalnız
     * `listPrice`/`currency` var — `supplier.id`/`name` yok).
     *
     * Alan yine de üretiliyor çünkü `ProductVariantTable` bunu bir KAPI olarak
     * okuyor: `hasSupplierData = options.some(o => o.suppliers.length > 0)` →
     * boş kalınca Tedarikçi sütunu ve rozeti gizleniyor. Kaldırılırsa o kapı
     * kırılır. Tedarikçi yüzeyi admin/satın alma ekranlarında yaşıyor.
     */
    suppliers: Array<{
        supplierId: string
        supplierName: string
        priceText: string
        currency: string
        isActive: boolean
    }>
    /** Bu ölçüdeki tüm varyant kodları. */
    fullCodes: string[]
    variants: Array<{
        id: string
        fullCode: string
        colorId: string | null
        materialIds: string[]
    }>
}

/**
 * Girdi DTO satırı. Alanlar GEVŞEK: bu katmandaki mapper'lar (`mapPublicProductVariantTableRow`,
 * `mapCustomerProductVariantTableRow`) bilinçli olarak gevşek tipli çıktı üretiyor
 * ve public/portal şekilleri birbirinden farklı.
 */
type VariantRowLike = {
    id: string
    fullCode: string
    measurements: MeasurementDisplayInput[]
    // `localizeColor` çıktısı statik olarak `id` bildirmiyor (any tabanlı), bu
    // yüzden opsiyonel: eşleşme çalışma zamanında id üzerinden yapılır.
    color?: { id?: string } | null
    materials?: Array<{ id?: string }> | null
}

function byDisplayOrder(a: any, b: any) {
    return (a?.measurementType?.displayOrder ?? 0) - (b?.measurementType?.displayOrder ?? 0)
}

/**
 * DTO satırlarını ölçüye göre gruplar. Sıra korunur: çağıran zaten `size.code`'a
 * göre sıralı getirir (kod küçükten büyüğe atanmıştır), bu yüzden burada YENİDEN
 * SIRALAMA YAPILMAZ — eski sürüm ilk ölçünün ham değerine göre sıralıyordu ve
 * çok ölçülü üründe kod sırasından ayrışabiliyordu.
 */
export function groupVariantTableRows(
    variants: readonly VariantRowLike[],
): GroupedVariantRow[] {
    const groups = new Map<string, GroupedVariantRow>()

    for (const variant of variants) {
        const key = buildMeasurementKey(variant.measurements)
        let group = groups.get(key)

        if (!group) {
            group = {
                key,
                label: toMeasurementLabel(variant.measurements),
                measurements: [...variant.measurements].sort(byDisplayOrder),
                colors: [],
                materials: [],
                suppliers: [],
                fullCodes: [],
                variants: [],
            }
            groups.set(key, group)
        }

        const color = variant.color
        if (color && !group.colors.some((entry) => entry?.id === color.id)) {
            group.colors.push(color)
        }

        for (const material of variant.materials ?? []) {
            if (!group.materials.some((entry) => entry?.id === material?.id)) {
                group.materials.push(material)
            }
        }

        if (!group.fullCodes.includes(variant.fullCode)) {
            group.fullCodes.push(variant.fullCode)
        }

        if (!group.variants.some((entry) => entry.id === variant.id)) {
            group.variants.push({
                id: variant.id,
                fullCode: variant.fullCode,
                colorId: variant.color?.id ?? null,
                materialIds: (variant.materials ?? [])
                    .map((material) => material?.id)
                    .filter((id): id is string => Boolean(id)),
            })
        }
    }

    return [...groups.values()]
}
