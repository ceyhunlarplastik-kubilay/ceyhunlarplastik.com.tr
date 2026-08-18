"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    createCampaignAnnouncement,
    getCampaignAnnouncements,
    updateCampaignAnnouncementRecipient,
    type ListAnnouncementsParams,
} from "@/features/sales/campaignAnnouncements/api/campaignAnnouncements"

const ANNOUNCEMENTS_KEY = "sales-campaign-announcements"

export function useCampaignAnnouncements(params: ListAnnouncementsParams) {
    return useQuery({
        queryKey: [ANNOUNCEMENTS_KEY, params],
        queryFn: () => getCampaignAnnouncements(params),
        placeholderData: (previous) => previous,
    })
}

export function useCreateCampaignAnnouncement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createCampaignAnnouncement,
        onSuccess: async () => {
            toast.success("Duyuru listesi oluşturuldu.")
            await queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_KEY] })
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Duyuru oluşturulamadı.")
        },
    })
}

export function useUpdateAnnouncementRecipient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateCampaignAnnouncementRecipient,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_KEY] })
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Güncellenemedi.")
        },
    })
}
