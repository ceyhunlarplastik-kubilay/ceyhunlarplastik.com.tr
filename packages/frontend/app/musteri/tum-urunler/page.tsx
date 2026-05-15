import { CustomerPortalAllProductsPageClient } from "@/features/customerPortal/components/CustomerPortalAllProductsPageClient"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"

export default async function CustomerPortalAllProductsPage() {
    const [categories, attributes] = await Promise.all([
        getCategories(),
        getAttributesForFilter(),
    ])

    return <CustomerPortalAllProductsPageClient categories={categories} attributes={attributes} />
}
