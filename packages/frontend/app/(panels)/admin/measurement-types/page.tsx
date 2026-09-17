"use client"

import { Ruler } from "lucide-react"
import { MeasurementTypesPageClient } from "@/features/admin/measurementTypes/components/MeasurementTypesPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function MeasurementTypesPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Ruler className="size-20" strokeWidth={1.5} />}
                    title="Ölçü tipleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <MeasurementTypesPageClient />
        </PageLoadingGate>
    )
}
