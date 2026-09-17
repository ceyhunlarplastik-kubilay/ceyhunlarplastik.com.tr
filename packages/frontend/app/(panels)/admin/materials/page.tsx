"use client"

import { FlaskConical } from "lucide-react"
import { MaterialsPageClient } from "@/features/admin/materials/components/MaterialsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function MaterialsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<FlaskConical className="size-20" strokeWidth={1.5} />}
                    title="Ham maddeler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <MaterialsPageClient />
        </PageLoadingGate>
    )
}
