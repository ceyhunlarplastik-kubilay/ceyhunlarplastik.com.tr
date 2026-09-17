import { Building2 } from "lucide-react"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { SalesCustomerOverviewPageClient } from "@/features/sales/customers/components/SalesCustomerOverviewPageClient"
import { auth } from "@/lib/auth/auth"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

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
            <PageLoadingGate
                overlay={(
                    <PageLoadingOverlay
                        icon={<Building2 className="size-20" strokeWidth={1.5} />}
                        title="Müşteri bilgileri yükleniyor"
                        description="Lütfen kısa bir an bekleyin."
                    />
                )}
            >
                <SalesCustomerOverviewPageClient customerId={id} canListUsers={canListUsers} />
            </PageLoadingGate>
        </CustomerWorkspaceShell>
    )
}
