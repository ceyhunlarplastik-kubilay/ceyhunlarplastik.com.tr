import { FileSpreadsheet } from "lucide-react"
import { getCategories } from "@/features/admin/categories/server/getCategories"
import { IndustrialUsageFunctionsPageClient } from "@/features/admin/industrialUsageFunctions/components/IndustrialUsageFunctionsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function ContentEntryIndustrialUsageFunctionsPage() {
    const categories = await getCategories()

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<FileSpreadsheet className="size-20" strokeWidth={1.5} />}
                    title="Kullanım fonksiyonu aktarımı yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <IndustrialUsageFunctionsPageClient
                categories={categories}
                workspaceLabel="Veri Girişi Paneli"
            />
        </PageLoadingGate>
    )
}
