import { NextResponse, type NextRequest } from "next/server";
import { getIndustrialFilterAttributes } from "@/features/public/productAttributes/server/getAttributesForFilter";

/**
 * Sidebar'ın endüstriyel kullanım filtreleri (sector / production_group / usage_area).
 *
 * Bu üç code 920 değer taşıyor ve kategori sayfasının attributes payload'unun %98.8'ini
 * (726KB) oluşturuyordu — hem de varsayılan KAPALI bir popover için. Buradan lazy çekilir.
 * `getIndustrialFilterAttributes` full (unstable_cache 60sn) sonucu yeniden kullanır →
 * ilave upstream fetch yok.
 */
export async function GET(request: NextRequest) {
    const locale = request.nextUrl.searchParams.get("locale") ?? "tr";
    const attributes = await getIndustrialFilterAttributes(locale);

    return NextResponse.json(
        { attributes },
        {
            headers: {
                // Public + locale bazlı, kullanıcıya özel değil → CDN/tarayıcı cache'leyebilir.
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        },
    );
}
