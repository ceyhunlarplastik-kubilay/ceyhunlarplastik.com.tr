import { publicServerClient } from "@/lib/http/serverClient";
import type { ListCategoriesResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";

export async function getCategories(): Promise<Category[]> {
    try {
        const res = await publicServerClient().get<ListCategoriesResponse>("/categories", {
            params: { limit: 500 },
        });

        return res.data.payload.data ?? [];
    } catch (error: any) {
        console.error("getCategories error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return [];
    }
}
