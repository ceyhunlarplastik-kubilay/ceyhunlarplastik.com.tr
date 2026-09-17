import { Settings } from "lucide-react"
import { ProductAttributeDetailPage } from "@/features/admin/productAttributes/components/ProductAttributeDetailPage"
import { getProductAttribute } from "@/features/admin/productAttributes/server/getProductAttribute"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default async function ContentEntryProductAttributeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const attribute = await getProductAttribute(id)

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Settings className="size-20" strokeWidth={1.5} />}
                    title="Özellik yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <ProductAttributeDetailPage
                attribute={attribute}
                backHref="/veri-girisi/productAttributes"
                workspaceLabel="Veri Girişi Özellikleri"
            />
        </PageLoadingGate>
    )
}
