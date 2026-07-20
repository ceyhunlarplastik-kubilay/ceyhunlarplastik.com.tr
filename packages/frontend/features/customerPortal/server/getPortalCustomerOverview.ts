import { cache } from "react";
import { protectedServerClient } from "@/lib/http/serverClient";
import type { PortalCustomerOverview } from "@/features/customerPortal/api/getPortalCustomerOverview";
import type { ApiEnvelope } from "@/lib/http/types";

type OverviewResponse = ApiEnvelope<{ customer: PortalCustomerOverview }>;

/**
 * Overview'un RSC-first fetch'i (panel ilk-yük dilim 3).
 *
 * Sayfa server'da veriyi çekip client'a `initialData` geçer → ilk boya spinner'sız
 * DOLU gelir. Layout `auth()` ile oturumu garanti ettiğinden token aynı isteğin
 * cookie'sinden gelir (ekstra HTTP yok). `unstable_cache` YOK (auth'lu panel);
 * yalnız React `cache()` ile istek-içi tekilleştirme. Hata → null: client hook
 * bugünkü spinner+client-fetch akışına zarif düşer, sayfa kırılmaz.
 */
export const getPortalCustomerOverview = cache(async (): Promise<PortalCustomerOverview | null> => {
    try {
        const client = await protectedServerClient();
        const res = await client.get<OverviewResponse>("/portal/customer/overview");
        return res.data.payload.customer ?? null;
    } catch (error: any) {
        // Next.js kontrol-akışı hatalarını (digest taşır) yutma — Next yakalamalı.
        if (error && typeof error.digest === "string") throw error;

        console.error(
            `getPortalCustomerOverview (server) error: status=${error?.response?.status} ` +
            `code=${error?.code} message=${error?.message ?? String(error)}`,
        );
        return null;
    }
});
