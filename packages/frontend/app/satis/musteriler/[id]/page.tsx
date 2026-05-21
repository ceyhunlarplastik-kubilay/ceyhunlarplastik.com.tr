import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { SalesCustomerOverviewPageClient } from "@/features/sales/customers/components/SalesCustomerOverviewPageClient"

export default async function SalesCustomerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id} scope="sales">
            <SalesCustomerOverviewPageClient customerId={id} />
        </CustomerWorkspaceShell>
    )
}
