"use client"

import { Palette } from "lucide-react"
import { ColorsPageClient } from "@/features/admin/colors/components/ColorsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function ColorsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Palette className="size-20" strokeWidth={1.5} />}
                    title="Renkler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <ColorsPageClient />
        </PageLoadingGate>
    )
}
