import { adminApiClient } from "@/lib/http/client"

type Params = {
    id: string
}

export async function deleteProduct({
    id,
}: Params): Promise<void> {
    await adminApiClient.delete(`/products/${id}`)
}
