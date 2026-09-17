"use client"

import { Folder } from "lucide-react"
import { CategoriesPageClient } from "@/features/admin/categories/components/CategoriesPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CategoriesPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Folder className="size-20" strokeWidth={1.5} />}
                    title="Kategoriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CategoriesPageClient />
        </PageLoadingGate>
    )
}
