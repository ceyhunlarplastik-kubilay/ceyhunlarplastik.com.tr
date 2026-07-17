import { adminApiClient } from "@/lib/http/client"
import type { ListCategoriesResponse } from "./types"
import { normalizeCategory } from "@/features/public/categories/normalizeCategory"

export type GetCategoriesParams = {
    page?: number
    limit?: number
    search?: string
    sort?: "code" | "name" | "createdAt"
    order?: "asc" | "desc"
}

export async function getCategories(
    params: GetCategoriesParams = {},
): Promise<ListCategoriesResponse["payload"]> {
    const res = await adminApiClient.get<ListCategoriesResponse>(
        "/categories",
        { params: { ...params, locale: "tr" } },
    )

    return {
        ...res.data.payload,
        data: res.data.payload.data.map((category) => normalizeCategory(category, "tr")),
    }
}
