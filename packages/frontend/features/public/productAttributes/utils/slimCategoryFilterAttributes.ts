import type { ProductAttribute } from "@/features/public/productAttributes/types";

// Kategori sayfası sidebar'ı industrial filtreleri (sector/production_group/usage_area)
// tüm değerleriyle gösterir; product-filter (non-industrial) code'larını ise kategorinin
// allowedAttributeValueIds'ine göre daraltır (ProductFilterSidebar ile aynı mantık).
const INDUSTRIAL_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"]);

/**
 * Kategori sayfasında sidebar'a geçmeden önce attributes payload'ını daraltır:
 * - `translations` (attribute + value) atılır — sidebar bunları HİÇ kullanmıyor (API zaten
 *   locale'e göre çözülmüş name/slug döndürüyor). En büyük ölü yük buydu.
 * - non-industrial value'lar kategorinin `allowedAttributeValueIds`'ine göre ön-filtrelenir
 *   (sidebar zaten client'ta aynısını yapıyor → sonuç değişmez, sadece payload küçülür).
 * - industrial code'ların değerleri OLDUĞU GİBİ kalır (sidebar hepsini gösteriyor).
 * Davranış birebir korunur; yalnızca RSC flight payload'u küçülür.
 */
export function slimCategoryFilterAttributes(
    attributes: ProductAttribute[],
    allowedAttributeValueIds: string[] | undefined,
    options: { excludeIndustrial?: boolean } = {},
): ProductAttribute[] {
    const allowed =
        allowedAttributeValueIds && allowedAttributeValueIds.length > 0
            ? new Set(allowedAttributeValueIds)
            : null;

    // excludeIndustrial: bu 920 değer (payload'un %98.8'i, 726KB) sidebar'da varsayılan
    // KAPALI bir popover'da duruyor → SSR payload'undan çıkarılıp client'ta lazy çekilir
    // (bkz. useIndustrialFilterAttributes + /api/product-filters/industrial).
    const source = options.excludeIndustrial
        ? attributes.filter((attribute) => !INDUSTRIAL_ATTRIBUTE_CODES.has(attribute.code))
        : attributes;

    return source.map((attribute) => {
        const isIndustrial = INDUSTRIAL_ATTRIBUTE_CODES.has(attribute.code);

        const values = (attribute.values ?? [])
            .filter((value) => {
                if (isIndustrial || !allowed) return true;
                if (allowed.has(value.id)) return true;
                if (value.parentValueId && allowed.has(value.parentValueId)) return true;
                return false;
            })
            .map((value) => {
                const slimValue = { ...value };
                // Artık genelde zaten yok (PublicApi göndermiyor, getAttributesForFilter
                // de ayıklıyor) — savunma amaçlı bırakıldı.
                delete slimValue.translations;
                return slimValue;
            });

        const slimAttribute = { ...attribute, values };
        delete slimAttribute.translations;
        return slimAttribute;
    });
}
