"use client"

import { protectedApiClient } from "@/lib/http/client"
import type {
    CampaignInput,
    ProductVariantCampaign,
    ProductVariantCampaignListPayload,
} from "@/features/sales/campaigns/api/types"

type ListResponse = { payload: ProductVariantCampaignListPayload }
type DetailResponse = { payload: { campaign: ProductVariantCampaign } }

const BASE = "/sales/product-variant-campaigns"

export type ListCampaignsParams = {
    page?: number
    limit?: number
    search?: string
    status?: ProductVariantCampaign["status"]
    currentOnly?: boolean
}

export async function getCampaigns(params: ListCampaignsParams = {}) {
    const res = await protectedApiClient.get<ListResponse>(BASE, {
        params: {
            ...params,
            // Uç `"true"`/`"false"` bekliyor; boolean gönderilirse şema reddeder.
            ...(params.currentOnly === undefined ? {} : { currentOnly: String(params.currentOnly) }),
        },
    })
    return res.data.payload
}

export async function getCampaign(id: string) {
    const res = await protectedApiClient.get<DetailResponse>(`${BASE}/${id}`)
    return res.data.payload.campaign
}

export async function createCampaign(input: CampaignInput) {
    const res = await protectedApiClient.post<DetailResponse>(BASE, input)
    return res.data.payload.campaign
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>) {
    const res = await protectedApiClient.patch<DetailResponse>(`${BASE}/${id}`, input)
    return res.data.payload.campaign
}

export async function deleteCampaign(id: string) {
    const res = await protectedApiClient.delete<DetailResponse>(`${BASE}/${id}`)
    return res.data.payload.campaign
}
