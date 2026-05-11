import { CustomerVisitsPageClient } from "@/features/admin/customers/components/CustomerVisitsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"

export default async function AdminCustomerVisitsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id}>
            <CustomerVisitsPageClient customerId={id} />
        </CustomerWorkspaceShell>
    )
}
