import { publicServerClient } from "@/lib/http/serverClient";
import type { ListAttributesResponse } from "@/features/public/productAttributes/types";
import type { ProductAttribute } from "@/features/public/productAttributes/types"
import { cache } from "react";
import { unstable_cache } from "next/cache";

const ALPHABETICAL_ATTRIBUTE_CODES = new Set([
    "sector",
    "production_group",
    "usage_area",
])

function sortValuesByName(values: NonNullable<ProductAttribute["values"]>, locale: string) {
    const collator = new Intl.Collator(locale === "en" ? "en" : "tr", {
        sensitivity: "base",
        numeric: true,
    })

    return [...values].sort((a, b) => collator.compare(a.name, b.name))
}

async function fetchAttributesForFilter(locale = "tr"): Promise<ProductAttribute[]> {
    try {
        const res = await publicServerClient().get<ListAttributesResponse>(
            "/product-attributes/with-values",
            { params: { locale } },
        );

        const attributes = res.data.payload.data ?? [];

        return attributes.map((attribute) => {
            if (!ALPHABETICAL_ATTRIBUTE_CODES.has(attribute.code) || !attribute.values?.length) {
                return attribute
            }

            return {
                ...attribute,
                values: sortValuesByName(attribute.values, locale),
            }
        })
    } catch (error: any) {
        console.error("getAttributesForFilter error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
}

const getCachedAttributesForFilter = unstable_cache(fetchAttributesForFilter, ["public-attributes-for-filter"], {
    revalidate: 60,
});

export const getAttributesForFilter = cache(async (locale = "tr"): Promise<ProductAttribute[]> => {
    try {
        return await getCachedAttributesForFilter(locale);
    } catch {
        return [];
    }
});
