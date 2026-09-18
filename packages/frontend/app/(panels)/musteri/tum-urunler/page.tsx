import { PackageSearch } from "lucide-react"
import { CustomerPortalAllProductsPageClient } from "@/features/customerPortal/components/CustomerPortalAllProductsPageClient"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"
import { slimCategoryFilterAttributes } from "@/features/public/productAttributes/utils/slimCategoryFilterAttributes"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function CustomerPortalAllProductsPage() {
    const [categories, attributes] = await Promise.all([
        getCategories(),
        getAttributesForFilter(),
    ])

    // Kategori sayfasıyla aynı desen: endüstriyel taksonomi (sector/production_group/
    // usage_area — 920 değer, attribute payload'unun ~%75'i) SSR payload'undan çıkarılır,
    // sidebar onu /api/product-filters/industrial üzerinden lazy çeker. Buradaki
    // "bana uygun" kısayolu da usage_area'yı o lazy veriden okur.
    // allowedAttributeValueIds YOK: portal kategori seçilene kadar tüm ürün filtrelerini
    // gösteriyor, bu yüzden non-industrial değerler daraltılmaz.
    const filterAttributes = slimCategoryFilterAttributes(attributes, undefined, {
        excludeIndustrial: true,
    })

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<PackageSearch className="size-20" strokeWidth={1.5} />}
                    title="Ürünler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalAllProductsPageClient categories={categories} attributes={filterAttributes} />
        </PageLoadingGate>
    )
}
