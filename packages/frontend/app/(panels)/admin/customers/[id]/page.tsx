import { Building2 } from "lucide-react"
import { CustomerOverviewPageClient } from "@/features/admin/customers/components/CustomerOverviewPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function AdminCustomerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id}>
            <PageLoadingGate
                overlay={(
                    <PageLoadingOverlay
                        icon={<Building2 className="size-20" strokeWidth={1.5} />}
                        title="Müşteri bilgileri yükleniyor"
                        description="Lütfen kısa bir an bekleyin."
                    />
                )}
            >
                <CustomerOverviewPageClient customerId={id} />
            </PageLoadingGate>
        </CustomerWorkspaceShell>
    )
}
