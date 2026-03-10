import axios from "axios";

function getPublicApiBaseUrl() {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }
    return url;
}

export async function getProductVariantTable(productId: string) {
    const baseURL = getPublicApiBaseUrl();

    try {
        const res = await axios.get(
            `/products/${productId}/variant-table`,
            {
                baseURL,
                timeout: 20_000,
            }
        );

        return res.data?.payload?.data ?? [];
    } catch (error: any) {
        // Return empty array on not found
        if (error?.response?.status === 404) {
            return [];
        }

        console.error("getProductVariantTable error:", {
            productId,
            status: error?.response?.status,
            data: error?.response?.data,
            message: error?.message,
        });

        return [];
    }
}