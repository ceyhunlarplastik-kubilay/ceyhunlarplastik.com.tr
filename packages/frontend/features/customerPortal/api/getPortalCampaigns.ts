"use client"

import { protectedApiClient } from "@/lib/http/client"
import type { ProductVariantCampaign } from "@/features/sales/campaigns/api/types"

type Response = { payload: { data: ProductVariantCampaign[] } }

/** Uç yalnız ACTIVE ve tarih penceresi içindeki kampanyaları döndürür. */
export async function getPortalCampaigns() {
    const res = await protectedApiClient.get<Response>("/portal/customer/campaigns")
    return res.data.payload.data
}
