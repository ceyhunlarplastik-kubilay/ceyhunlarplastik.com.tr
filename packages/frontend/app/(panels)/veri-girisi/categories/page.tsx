import { Boxes } from "lucide-react"
import { CategoriesPageClient } from "@/features/admin/categories/components/CategoriesPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function ContentEntryCategoriesPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Boxes className="size-20" strokeWidth={1.5} />}
                    title="Kategoriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CategoriesPageClient />
        </PageLoadingGate>
    )
}
