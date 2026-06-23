import { CustomerAssignedVariantsPageClient } from "@/features/admin/customers/components/CustomerAssignedVariantsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"

export default async function SalesCustomerDefinedProductsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [categories, attributes] = await Promise.all([
        getCategories(),
        getAttributesForFilter(),
    ])

    return (
        <CustomerWorkspaceShell customerId={id} scope="sales">
            <CustomerAssignedVariantsPageClient
                customerId={id}
                scope="sales"
                categories={categories}
                attributes={attributes}
                basePath={`/satis/musteriler/${id}/defined-products`}
            />
        </CustomerWorkspaceShell>
    )
}
