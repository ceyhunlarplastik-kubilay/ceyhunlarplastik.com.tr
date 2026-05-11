import { CustomerOverviewPageClient } from "@/features/admin/customers/components/CustomerOverviewPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"

export default async function AdminCustomerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id}>
            <CustomerOverviewPageClient customerId={id} />
        </CustomerWorkspaceShell>
    )
}
