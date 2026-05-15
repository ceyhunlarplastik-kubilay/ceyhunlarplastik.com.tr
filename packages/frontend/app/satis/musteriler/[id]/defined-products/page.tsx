import { CustomerFeaturedProductsPageClient } from "@/features/admin/customers/components/CustomerFeaturedProductsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"

export default async function SalesCustomerDefinedProductsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id} scope="sales">
            <CustomerFeaturedProductsPageClient customerId={id} scope="sales" mode="assigned" />
        </CustomerWorkspaceShell>
    )
}
