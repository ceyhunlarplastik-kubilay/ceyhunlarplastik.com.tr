import { Boxes } from "lucide-react"
import { SupplierVariantPricesPageClient } from "@/features/supplier/variantPrices/components/SupplierVariantPricesPageClient"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"
import { slimCategoryFilterAttributes } from "@/features/public/productAttributes/utils/slimCategoryFilterAttributes"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

// Müşteri portalı ürün kataloğuyla (`/musteri/tum-urunler`) AYNI veri kaynağı ve
// aynı SSR deseni (kullanıcı talebiyle) — kategori/özellik filtre sidebar'ı
// `ProductFilterSidebar` bu SSR payload'u bekliyor.
export default async function SalesProductsPage() {
    const [categories, attributes] = await Promise.all([
        getCategories(),
        getAttributesForFilter(),
    ])

    // Kategori sayfasıyla aynı desen: endüstriyel taksonomi (sector/production_group/
    // usage_area) SSR payload'undan çıkarılır, sidebar onu lazy çeker (bkz.
    // ProductFilterSidebar `lazyIndustrialAttributes`).
    const filterAttributes = slimCategoryFilterAttributes(attributes, undefined, {
        excludeIndustrial: true,
    })

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Boxes className="size-20" strokeWidth={1.5} />}
                    title="Ürünler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <SupplierVariantPricesPageClient
                mode="sales"
                categories={categories}
                attributes={filterAttributes}
            />
        </PageLoadingGate>
    )
}
