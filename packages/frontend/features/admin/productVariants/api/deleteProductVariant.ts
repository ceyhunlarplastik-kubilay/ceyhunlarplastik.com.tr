import { adminApiClient } from "@/lib/http/client"

type Params = {
    id: string
}

export async function deleteProductVariant({ id }: Params): Promise<void> {
    await adminApiClient.delete(`/product-variants/${id}`)
}
