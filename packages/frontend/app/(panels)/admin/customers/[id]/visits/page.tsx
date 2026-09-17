import { CalendarClock } from "lucide-react"
import { CustomerVisitsPageClient } from "@/features/admin/customers/components/CustomerVisitsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function AdminCustomerVisitsPage({
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
                        icon={<CalendarClock className="size-20" strokeWidth={1.5} />}
                        title="Ziyaretler yükleniyor"
                        description="Lütfen kısa bir an bekleyin."
                    />
                )}
            >
                <CustomerVisitsPageClient customerId={id} />
            </PageLoadingGate>
        </CustomerWorkspaceShell>
    )
}
