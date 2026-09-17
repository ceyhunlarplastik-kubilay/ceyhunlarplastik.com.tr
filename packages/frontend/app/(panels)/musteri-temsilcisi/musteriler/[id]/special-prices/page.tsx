import { BadgePercent } from "lucide-react"
import { CustomerSpecialPricesPageClient } from "@/features/admin/customers/components/CustomerSpecialPricesPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function SalesCustomerSpecialPricesPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <CustomerWorkspaceShell customerId={id} scope="sales">
            <PageLoadingGate
                overlay={(
                    <PageLoadingOverlay
                        icon={<BadgePercent className="size-20" strokeWidth={1.5} />}
                        title="Özel fiyatlar yükleniyor"
                        description="Lütfen kısa bir an bekleyin."
                    />
                )}
            >
                <CustomerSpecialPricesPageClient customerId={id} />
            </PageLoadingGate>
        </CustomerWorkspaceShell>
    )
}
