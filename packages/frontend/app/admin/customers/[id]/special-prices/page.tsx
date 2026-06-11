import { CustomerSpecialPricesPageClient } from "@/features/admin/customers/components/CustomerSpecialPricesPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"

export default async function AdminCustomerSpecialPricesPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id}>
            <CustomerSpecialPricesPageClient customerId={id} />
        </CustomerWorkspaceShell>
    )
}
