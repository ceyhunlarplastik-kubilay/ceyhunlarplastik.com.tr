import { Boxes } from "lucide-react"
import { getCategories } from "@/features/admin/categories/server/getCategories"
import { ProductsPageClient } from "@/features/admin/products/components/ProductsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function Page() {

    const categories = await getCategories()

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
            <ProductsPageClient
                categories={categories}
                showMatchedCustomers
            />
        </PageLoadingGate>
    )

}
