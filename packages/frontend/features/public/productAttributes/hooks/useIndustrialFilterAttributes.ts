import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { IndustrialFilterAttribute } from "@/features/public/productAttributes/server/getAttributesForFilter";

/**
 * Sidebar'ın endüstriyel kullanım filtrelerini lazy çeker (BFF: /api/product-filters/industrial).
 *
 * `enabled=false` iken hiç istek gitmez ve bu veri sayfanın ilk HTML'ine de serialize
 * edilmez. Query key locale bazlı ve paylaşımlı → kategoriler arası geçişte tekrar inmez.
 */
export function useIndustrialFilterAttributes(enabled: boolean) {
    const locale = useLocale();

    return useQuery({
        queryKey: ["industrial-filter-attributes", locale],
        queryFn: async (): Promise<IndustrialFilterAttribute[]> => {
            const res = await fetch(
                `/api/product-filters/industrial?locale=${encodeURIComponent(locale)}`,
            );
            if (!res.ok) throw new Error("industrial filter attributes fetch failed");
            const json = (await res.json()) as { attributes?: IndustrialFilterAttribute[] };
            return json.attributes ?? [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}
