import axios from "axios";
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable";

function getPublicApiBaseUrl() {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }
    return url;
}

type GetProductVariantTableApiResponse = {
    statusCode: number
    payload: {
        data: VariantTableData[]
    }
}

export async function getProductVariantTable(productId: string): Promise<VariantTableData[]> {
    const baseURL = getPublicApiBaseUrl();

    try {
        const res = await axios.get<GetProductVariantTableApiResponse>(
            `/products/${productId}/variant-table`,
            {
                baseURL,
                timeout: 20_000,
                params: {
                    limit: 500,
                },
            }
        );

        return res.data?.payload?.data ?? [];
    } catch (error: unknown) {
        const err = error as { response?: { status?: number; data?: unknown }; message?: string }
        // Return empty array on not found
        if (err?.response?.status === 404) {
            return [];
        }

        console.error("getProductVariantTable error:", {
            productId,
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
        });

        return [];
    }
}
