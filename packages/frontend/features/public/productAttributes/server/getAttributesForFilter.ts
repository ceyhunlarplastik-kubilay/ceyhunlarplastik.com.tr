import { publicServerClient } from "@/lib/http/serverClient";
import type { ListAttributesResponse } from "@/features/public/productAttributes/types";
import type { ProductAttribute } from "@/features/public/productAttributes/types"

const ALPHABETICAL_ATTRIBUTE_CODES = new Set([
    "sector",
    "production_group",
    "usage_area",
])

const trCollator = new Intl.Collator("tr", {
    sensitivity: "base",
    numeric: true,
})

function sortValuesByName(values: NonNullable<ProductAttribute["values"]>) {
    return [...values].sort((a, b) => trCollator.compare(a.name, b.name))
}

export async function getAttributesForFilter(): Promise<ProductAttribute[]> {
    try {
        const res = await publicServerClient().get<ListAttributesResponse>("/product-attributes/with-values");

        const attributes = res.data.payload.data ?? [];

        return attributes.map((attribute) => {
            if (!ALPHABETICAL_ATTRIBUTE_CODES.has(attribute.code) || !attribute.values?.length) {
                return attribute
            }

            return {
                ...attribute,
                values: sortValuesByName(attribute.values),
            }
        })
    } catch (error: any) {
        console.error("getAttributesForFilter error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return [];
    }
}
