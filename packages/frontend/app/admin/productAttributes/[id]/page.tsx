import { ProductAttributeValuesManager } from "@/features/admin/productAttributes/components/ProductAttributeValuesManager"
import { getProductAttribute } from "@/features/admin/productAttributes/server/getProductAttribute"
// import { adminApiClient } from "@/lib/http/client"

/* async function getAttribute(id: string) {
    const res = await adminApiClient.get(`/product-attributes/${id}`)
    return res.data.payload.productAttribute
} */

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const attribute = await getProductAttribute(id)

    return (
        <div className="space-y-6 p-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold">
                    {attribute.name}
                </h1>
                <p className="text-sm text-neutral-500">
                    {attribute.code}
                </p>
            </div>

            {/* VALUES MANAGER */}
            <div className="max-w-xl">
                <ProductAttributeValuesManager attributeId={attribute.id} />
            </div>

        </div>
    )
}
