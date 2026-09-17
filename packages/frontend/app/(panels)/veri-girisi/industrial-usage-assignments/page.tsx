import { ClipboardList } from "lucide-react"
import { IndustrialUsageAssignmentsPageClient } from "@/features/admin/industrialUsageAssignments/components/IndustrialUsageAssignmentsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function ContentEntryIndustrialUsageAssignmentsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ClipboardList className="size-20" strokeWidth={1.5} />}
                    title="Kullanım alanı ürün atamaları yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <IndustrialUsageAssignmentsPageClient workspaceLabel="Veri Girişi Paneli" />
        </PageLoadingGate>
    )
}
