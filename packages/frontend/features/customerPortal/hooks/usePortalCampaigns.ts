"use client"

import { useQuery } from "@tanstack/react-query"

import { getPortalCampaigns } from "@/features/customerPortal/api/getPortalCampaigns"

export function usePortalCampaigns() {
    return useQuery({
        queryKey: ["customer-portal-campaigns"],
        queryFn: getPortalCampaigns,
        staleTime: 1000 * 60,
    })
}
