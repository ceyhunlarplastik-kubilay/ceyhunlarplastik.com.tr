import axios from "axios";
import { auth } from "@/lib/auth/auth";
// Public'den alındı şuan
import type { Category } from "@/features/public/categories/types";

type ListCategoriesApiResponse = {
    statusCode: number;
    payload: {
        data: Category[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
};

export async function getCategories(): Promise<Category[]> {
    const session = await auth();

    if (!session?.idToken) {
        throw new Error("Unauthorized");
    }

    const res = await axios.get<ListCategoriesApiResponse>(
        `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories`,
        {
            headers: { Authorization: `Bearer ${session.idToken}` },
        }
    );

    return res.data.payload.data ?? [];
}