import { CustomerAssignedVariantsPageClient } from "@/features/admin/customers/components/CustomerAssignedVariantsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"

export default async function AdminCustomerDefinedProductsPage({
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
        <CustomerWorkspaceShell customerId={id}>
            <CustomerAssignedVariantsPageClient
                customerId={id}
                categories={categories}
                attributes={attributes}
                basePath={`/admin/customers/${id}/defined-products`}
            />
        </CustomerWorkspaceShell>
    )
}
