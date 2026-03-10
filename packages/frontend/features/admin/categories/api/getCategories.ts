import { adminApiClient } from "@/lib/http/client"
import type { Category } from "@/features/public/categories/types"
import type { ListCategoriesResponse } from "./types"

export async function getCategories(): Promise<Category[]> {

    const res =
        await adminApiClient.get<ListCategoriesResponse>(
            "/categories"
        )

    return res.data.payload.data ?? []
}
