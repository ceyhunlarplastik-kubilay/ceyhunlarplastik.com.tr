import { getCategories } from "@/features/admin/categories/server/getCategories"
import { ProductsPageClient } from "@/features/admin/products/components/ProductsPageClient"

export default async function Page() {

    const categories = await getCategories()

    return (
        <ProductsPageClient
            categories={categories}
        />
    )

}