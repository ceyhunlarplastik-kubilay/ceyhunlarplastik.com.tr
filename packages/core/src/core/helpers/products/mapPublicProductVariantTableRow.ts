import { mapAsset } from "@/core/helpers/assets/mapProductWithAssets"

/**
 * Varyant tablosu satırının ORTAK (hassas olmayan) yapısı: ölçü, renk, hammadde,
 * kodlar. Ne fiyat ne tedarikçi içerir — public ve customer DTO'ları bunu paylaşır.
 */
function mapVariantTableStructure(variant: any) {
    return {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        versionCode: variant.versionCode,
        supplierCode: variant.supplierCode,
        variantIndex: variant.variantIndex,
        fullCode: variant.fullCode,
        colorId: variant.colorId ?? null,
        color: variant.color ?? null,
        materials: (variant.materials ?? []).map((material: any) => ({
            id: material.id,
            name: material.name,
            code: material.code ?? null,
            assets: (material.assets ?? []).map(mapAsset),
        })),
        measurements: (variant.measurements ?? []).map((measurement: any) => ({
            id: measurement.id,
            value: measurement.value,
            label: measurement.label ?? "",
            measurementType: measurement.measurementType,
        })),
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
    }
}

/**
 * PUBLIC varyant tablosu satırı (P1.8 B0).
 *
 * Fiyat ve tedarikçi bilgisi HİÇ taşınmaz — public kullanıcı bunları ne UI'da
 * ne network yanıtında görmemeli (iş kuralı + veri sızıntısı önlemi). Repository
 * `includeListPrice:false` ile çağrıldığından variantSuppliers zaten çekilmez;
 * bu mapper da onu döndürmez.
 */
export function mapPublicProductVariantTableRow(variant: any) {
    return mapVariantTableStructure(variant)
}

/**
 * CUSTOMER varyant tablosu satırı (P1.8 B0).
 *
 * Public yapıya EK olarak yalnız liste fiyatı alanlarını taşır
 * (resolveMinListPrice'ın kullandığı): listPrice, currency, pricingUpdatedAt,
 * updatedAt. Tedarikçi kimliği (id/name) ve tedarikçi maliyeti (price/netCost/
 * profitRate/...) HİÇ taşınmaz — bunlar admin/sales'e özgüdür (bkz. B0-admin).
 * Yalnız ProtectedApi (giriş yapmış) endpoint'inden döner.
 */
export function mapCustomerProductVariantTableRow(variant: any) {
    return {
        ...mapVariantTableStructure(variant),
        variantSuppliers: (variant.variantSuppliers ?? []).map((item: any) => ({
            listPrice: item.listPrice ?? null,
            currency: item.currency ?? null,
            pricingUpdatedAt: item.pricingUpdatedAt ?? null,
            updatedAt: item.updatedAt,
        })),
    }
}
