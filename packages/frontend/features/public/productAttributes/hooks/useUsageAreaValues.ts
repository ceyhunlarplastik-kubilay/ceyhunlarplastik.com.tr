import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { ProductAttributeFilterValue } from "@/features/public/productAttributes/types";

/**
 * usage_area slim value'larını lazy çeker (BFF: /api/assistant/usage-areas).
 * Asistan/dialog usage adımına gelene kadar `enabled=false` → ilk yükte istek gitmez,
 * bu veri ilk sayfa HTML'ine de serialize edilmez.
 */
export function useUsageAreaValues(enabled: boolean) {
    const locale = useLocale();

    return useQuery({
        queryKey: ["usage-area-values", locale],
        queryFn: async (): Promise<ProductAttributeFilterValue[]> => {
            const res = await fetch(
                `/api/assistant/usage-areas?locale=${encodeURIComponent(locale)}`,
            );
            if (!res.ok) throw new Error("usage-area values fetch failed");
            const json = (await res.json()) as { values?: ProductAttributeFilterValue[] };
            return json.values ?? [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}
