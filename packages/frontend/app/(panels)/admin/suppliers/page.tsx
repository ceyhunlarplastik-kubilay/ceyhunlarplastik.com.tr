import { Truck } from "lucide-react"
import { SuppliersPageClient } from "@/features/admin/suppliers/components/SuppliersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminSuppliersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Truck className="size-20" strokeWidth={1.5} />}
                    title="Tedarikçiler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <SuppliersPageClient />
        </PageLoadingGate>
    )
}
