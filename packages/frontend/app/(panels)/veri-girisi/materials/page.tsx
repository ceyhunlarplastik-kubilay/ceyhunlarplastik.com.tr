import { Layers3 } from "lucide-react"
import { MaterialsPageClient } from "@/features/admin/materials/components/MaterialsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function ContentEntryMaterialsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Layers3 className="size-20" strokeWidth={1.5} />}
                    title="Ham maddeler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <MaterialsPageClient />
        </PageLoadingGate>
    )
}
