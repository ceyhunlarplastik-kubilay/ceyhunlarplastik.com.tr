"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    createCampaign,
    deleteCampaign,
    getCampaigns,
    updateCampaign,
    type ListCampaignsParams,
} from "@/features/sales/campaigns/api/campaigns"
import type { CampaignInput } from "@/features/sales/campaigns/api/types"

const CAMPAIGNS_KEY = "sales-product-variant-campaigns"

export function useCampaigns(params: ListCampaignsParams) {
    return useQuery({
        queryKey: [CAMPAIGNS_KEY, params],
        queryFn: () => getCampaigns(params),
        // Filtre/sayfa değişiminde liste boşalmasın (repo refetch deseni).
        placeholderData: (previous) => previous,
    })
}

function useCampaignMutation<TInput>(
    mutationFn: (input: TInput) => Promise<unknown>,
    successMessage: string,
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn,
        onSuccess: async () => {
            toast.success(successMessage)
            await queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_KEY] })
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "İşlem tamamlanamadı.")
        },
    })
}

export function useCreateCampaign() {
    return useCampaignMutation<CampaignInput>(createCampaign, "Kampanya oluşturuldu.")
}

export function useUpdateCampaign() {
    return useCampaignMutation<{ id: string; input: Partial<CampaignInput> }>(
        ({ id, input }) => updateCampaign(id, input),
        "Kampanya güncellendi.",
    )
}

export function useDeleteCampaign() {
    return useCampaignMutation<string>(deleteCampaign, "Kampanya silindi.")
}
