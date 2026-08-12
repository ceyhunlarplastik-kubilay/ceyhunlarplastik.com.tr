import { getCategories } from "@/features/admin/categories/server/getCategories"
import { IndustrialUsageFunctionsPageClient } from "@/features/admin/industrialUsageFunctions/components/IndustrialUsageFunctionsPageClient"

export default async function ContentEntryIndustrialUsageFunctionsPage() {
    const categories = await getCategories()

    return (
        <IndustrialUsageFunctionsPageClient
            categories={categories}
            workspaceLabel="Veri Girişi Paneli"
        />
    )
}
