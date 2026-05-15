import { publicApiClient } from "@/lib/http/client"
import type { Category } from "@/features/public/categories/types"
import type { ListCategoriesResponse } from "@/features/public/categories/api/types"

export async function getProductFilterCategories() {
    const res = await publicApiClient.get<ListCategoriesResponse>("/categories", {
        params: { page: 1, limit: 500, sort: "name", order: "asc" },
    })

    return res.data.payload.data as Category[]
}
