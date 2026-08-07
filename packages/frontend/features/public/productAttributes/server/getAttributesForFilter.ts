import { publicServerClient } from "@/lib/http/serverClient";
import type { ListAttributesResponse } from "@/features/public/productAttributes/types";
import type {
    ProductAttribute,
    ProductAttributeValue,
    ProductAttributeFilter,
    ProductAttributeFilterValue,
} from "@/features/public/productAttributes/types"
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Asistan/dialog'un ilk adımlarında (SSR) gereken küçük code'lar.
// usage_area (~805 value ≈ full payload'un çoğu) SSR'a dahil EDİLMEZ; kendi adımına
// gelince client'ta lazy çekilir (getUsageAreaValues + /api/assistant/usage-areas).
const ASSISTANT_EAGER_CODES = new Set(["sector", "production_group"])

// Full value → slim value (id/name/slug/parentValueId + yalnız PRIMARY asset).
function toSlimValues(values: ProductAttributeValue[] = []): ProductAttributeFilterValue[] {
    return values.map((value) => ({
        id: value.id,
        name: value.name,
        slug: value.slug,
        parentValueId: value.parentValueId ?? null,
        assets: (value.assets ?? [])
            .filter((asset) => asset.role === "PRIMARY")
            .map((asset) => ({ id: asset.id, role: asset.role, url: asset.url })),
    }))
}

const ALPHABETICAL_ATTRIBUTE_CODES = new Set([
    "sector",
    "production_group",
    "usage_area",
])

function sortValuesByName(values: NonNullable<ProductAttribute["values"]>, locale: string) {
    const collator = // Sıralama istenen dilin kurallarına göre yapılır; eskiden EN dışındaki
    // her dil TR collation'ına düşüyordu.
    new Intl.Collator(locale, {
        sensitivity: "base",
        numeric: true,
    })

    return [...values].sort((a, b) => collator.compare(a.name, b.name))
}

/**
 * Ham çeviri satırlarını at. Backend (PublicApi) artık bunları hiç göndermiyor;
 * bu ikinci savunma hattı, backend deploy'undan BAĞIMSIZ olarak cache'lenen
 * değerin küçük kalmasını garanti eder ve eski bir yanıt geldiğinde de korur.
 *
 * NEDEN ÖNEMLİ: `unstable_cache` 2 MB'tan büyük bir değeri sessizce YAZMAZ.
 * Ölçüm (2026-08-07): yanıt 4.45 MB, %71.6'sı `translations` + %10.6'sı
 * `alternateSlugs` → cache hiç yazılamıyor, bu fetch public layout'ta olduğu için
 * her sayfa/her dil/her render'da baştan koşuyordu. İkisi de public tarafta
 * OKUNMUYOR (isim/slug sunucuda çözülüp `name`/`slug`'a yazılıyor; attribute
 * `alternateSlugs`'ını okuyan hiçbir yüzey yok — kategori/ürün'ünkiler ayrı).
 */
function stripLocalizationSource(attribute: ProductAttribute): ProductAttribute {
    const slim = { ...attribute }
    delete slim.translations

    slim.values = attribute.values?.map((value) => {
        const slimValue = { ...value }
        delete slimValue.translations
        delete slimValue.alternateSlugs
        return slimValue
    })

    return slim
}

async function fetchAttributesForFilter(locale = "tr"): Promise<ProductAttribute[]> {
    try {
        const res = await publicServerClient().get<ListAttributesResponse>(
            "/product-attributes/with-values",
            { params: { locale } },
        );

        const attributes = res.data.payload.data ?? [];

        return attributes.map((attribute) => {
            const slim = stripLocalizationSource(attribute)

            if (!ALPHABETICAL_ATTRIBUTE_CODES.has(slim.code) || !slim.values?.length) {
                return slim
            }

            return {
                ...slim,
                values: sortValuesByName(slim.values, locale),
            }
        })
    } catch (error: any) {
        console.error("getAttributesForFilter error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
}

const getCachedAttributesForFilter = unstable_cache(fetchAttributesForFilter, ["public-attributes-for-filter"], {
    revalidate: 60,
});

export const getAttributesForFilter = cache(async (locale = "tr"): Promise<ProductAttribute[]> => {
    try {
        return await getCachedAttributesForFilter(locale);
    } catch {
        return [];
    }
});

/**
 * Slim varyant: full (cache'li) attribute ağacından yalnız 3 müşteri-profili code'unu ve
 * value başına id/name/slug/parentValueId + PRIMARY asset'i döndürür. Full fn'i çağırdığı
 * için ilave endpoint fetch'i YOK (React cache + unstable_cache paylaşılır); yalnızca
 * client'a serialize edilen RSC flight payload'ını ~1.28MB'den ~10-20KB'ye indirir.
 * NOT: paylaşılan `getAttributesForFilter` filtre/kategori/admin sayfalarında full haliyle
 * kullanılmaya devam eder — bu slim fn onların yerine GEÇMEZ.
 */
export const getAssistantAttributes = cache(async (locale = "tr"): Promise<ProductAttributeFilter[]> => {
    const full = await getAttributesForFilter(locale);

    return full
        .filter((attribute) => ASSISTANT_EAGER_CODES.has(attribute.code))
        .map((attribute) => ({
            code: attribute.code,
            values: toSlimValues(attribute.values),
        }));
});

/**
 * usage_area slim value'ları — asistan/dialog kendi usage adımına gelince client'ta lazy
 * çekilir (bkz. app/api/assistant/usage-areas/route.ts). full (cache'li) sonucu yeniden
 * kullanır; ilave endpoint fetch'i yok. Bu, ~250KB usage_area verisini ilk HTML'den çıkarır.
 */
export const getUsageAreaValues = cache(async (locale = "tr"): Promise<ProductAttributeFilterValue[]> => {
    const full = await getAttributesForFilter(locale);
    const usageArea = full.find((attribute) => attribute.code === "usage_area");
    return toSlimValues(usageArea?.values);
});

const INDUSTRIAL_FILTER_CODES = ["sector", "production_group", "usage_area"] as const

export type IndustrialFilterAttribute = {
    id: string
    code: string
    name: string
    values: { id: string; name: string; slug: string; parentValueId?: string | null }[]
}

/**
 * ProductFilterSidebar'ın "endüstriyel kullanım" bölümü için slim attribute listesi.
 *
 * NEDEN: Bu üç code (sector/production_group/usage_area) 920 değer taşıyor ve kategori
 * sayfasında slim edilmiş attributes payload'unun **%98.8'i (726KB)** bunlardan geliyordu —
 * üstelik varsayılan olarak KAPALI bir popover'ın içinde. Sidebar bu değerlerden yalnız
 * id/name/slug/parentValueId okuyor (assets yalnız kategori önizlemesinde kullanılıyor),
 * bu yüzden lazy yanıt çok daha küçük.
 *
 * Full (cache'li) sonucu yeniden kullanır → ilave upstream fetch yok.
 */
export const getIndustrialFilterAttributes = cache(async (locale = "tr"): Promise<IndustrialFilterAttribute[]> => {
    const full = await getAttributesForFilter(locale);

    return INDUSTRIAL_FILTER_CODES
        .map((code) => full.find((attribute) => attribute.code === code))
        .filter((attribute): attribute is ProductAttribute => Boolean(attribute))
        .map((attribute) => ({
            id: attribute.id,
            code: attribute.code,
            name: attribute.name,
            values: (attribute.values ?? []).map((value) => ({
                id: value.id,
                name: value.name,
                slug: value.slug,
                parentValueId: value.parentValueId ?? null,
            })),
        }));
});
