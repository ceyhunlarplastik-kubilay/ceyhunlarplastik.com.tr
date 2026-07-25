import { NextResponse, type NextRequest } from "next/server";
import { getUsageAreaValues } from "@/features/public/productAttributes/server/getAttributesForFilter";

// Asistan/numune-talep dialog'unun usage adımı için slim usage_area value'ları.
// Bu veri ilk sayfa HTML'inden çıkarıldı (~250KB); client yalnız usage adımına gelince çeker.
// getUsageAreaValues full (unstable_cache 60sn) sonucu yeniden kullanır → ilave upstream fetch yok.
export async function GET(request: NextRequest) {
    const locale = request.nextUrl.searchParams.get("locale") ?? "tr";
    const values = await getUsageAreaValues(locale);

    return NextResponse.json(
        { values },
        {
            headers: {
                // Public + locale bazlı, kullanıcıya özel değil → CDN/tarayıcı cache'leyebilir.
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        },
    );
}
