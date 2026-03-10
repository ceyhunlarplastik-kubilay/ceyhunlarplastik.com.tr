import { adminApiClient } from "@/lib/http/client"

type Params = {
    id: string
}

export async function deleteCategory({
    id,
}: Params): Promise<void> {

    await adminApiClient.delete(
        `/categories/${id}`
    )
}
