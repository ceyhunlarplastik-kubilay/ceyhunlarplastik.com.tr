import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { SalesCustomerOverviewPageClient } from "@/features/sales/customers/components/SalesCustomerOverviewPageClient"
import { auth } from "@/lib/auth/auth"

export default async function SalesCustomerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await auth()
    const groups = session?.user?.groups ?? []
    const canListUsers = groups.includes("sales_director") || groups.includes("admin") || groups.includes("owner")

    return (
        <CustomerWorkspaceShell customerId={id} scope="sales">
            <SalesCustomerOverviewPageClient customerId={id} canListUsers={canListUsers} />
        </CustomerWorkspaceShell>
    )
}
