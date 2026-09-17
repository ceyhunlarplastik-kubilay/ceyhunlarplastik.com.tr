import { Package } from "lucide-react"
import { getCategories } from "@/features/admin/categories/server/getCategories"
import { ProductsPageClient } from "@/features/admin/products/components/ProductsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function ContentEntryProductsPage() {
    const categories = await getCategories()

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Package className="size-20" strokeWidth={1.5} />}
                    title="Ürünler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <ProductsPageClient
                categories={categories}
                showVariantsLink
                variantsBasePath="/veri-girisi/products"
            />
        </PageLoadingGate>
    )
}
