import { Layers3 } from "lucide-react"
import { CustomerAssignedVariantsPageClient } from "@/features/admin/customers/components/CustomerAssignedVariantsPageClient"
import { CustomerWorkspaceShell } from "@/features/admin/customers/components/CustomerWorkspaceShell"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function AdminCustomerDefinedProductsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [categories, attributes] = await Promise.all([
        getCategories(),
        getAttributesForFilter(),
    ])

    return (
        <CustomerWorkspaceShell customerId={id}>
            <PageLoadingGate
                overlay={(
                    <PageLoadingOverlay
                        icon={<Layers3 className="size-20" strokeWidth={1.5} />}
                        title="Tanımlı varyantlar yükleniyor"
                        description="Lütfen kısa bir an bekleyin."
                    />
                )}
            >
                <CustomerAssignedVariantsPageClient
                    customerId={id}
                    categories={categories}
                    attributes={attributes}
                    basePath={`/admin/customers/${id}/defined-products`}
                />
            </PageLoadingGate>
        </CustomerWorkspaceShell>
    )
}
