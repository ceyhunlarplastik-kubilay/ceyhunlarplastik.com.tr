import { CustomerFeaturedProductsPageClient } from "@/features/admin/customers/components/CustomerFeaturedProductsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"

export default async function AdminCustomerProductsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id}>
            <CustomerFeaturedProductsPageClient customerId={id} />
        </CustomerWorkspaceShell>
    )
}
