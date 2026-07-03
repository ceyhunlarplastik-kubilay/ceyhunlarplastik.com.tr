import { ProductAttributeDetailPage } from "@/features/admin/productAttributes/components/ProductAttributeDetailPage"
import { getProductAttribute } from "@/features/admin/productAttributes/server/getProductAttribute"

export default async function ContentEntryProductAttributeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const attribute = await getProductAttribute(id)

    return (
        <ProductAttributeDetailPage
            attribute={attribute}
            backHref="/veri-girisi/productAttributes"
            workspaceLabel="Veri Girişi Özellikleri"
        />
    )
}
