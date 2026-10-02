import { History } from "lucide-react"
import { CustomerAuditHistory } from "@/features/admin/customers/components/CustomerAuditHistory"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function AdminCustomerHistoryPage({
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
                        icon={<History className="size-20" strokeWidth={1.5} />}
                        title="Değişiklik geçmişi yükleniyor"
                        description="Lütfen kısa bir an bekleyin."
                    />
                )}
            >
                <CustomerAuditHistory customerId={id} />
            </PageLoadingGate>
        </CustomerWorkspaceShell>
    )
}
