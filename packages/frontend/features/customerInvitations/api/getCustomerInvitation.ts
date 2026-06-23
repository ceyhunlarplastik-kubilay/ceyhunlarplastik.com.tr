"use client"

import { publicApiClient } from "@/lib/http/client"
import type { CustomerInvitationResponse } from "@/features/customerInvitations/api/types"

export async function getCustomerInvitation(token: string) {
    const res = await publicApiClient.get<CustomerInvitationResponse>(`/customer-invitations/${encodeURIComponent(token)}`)
    return res.data.payload.invitation
}
