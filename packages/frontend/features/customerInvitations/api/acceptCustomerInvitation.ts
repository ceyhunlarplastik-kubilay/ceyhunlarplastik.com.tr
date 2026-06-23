"use client"

import { publicApiClient } from "@/lib/http/client"
import type { AcceptCustomerInvitationResponse } from "@/features/customerInvitations/api/types"

export async function acceptCustomerInvitation(input: { token: string; password: string }) {
    const res = await publicApiClient.post<AcceptCustomerInvitationResponse>("/customer-invitations/accept", input)
    return res.data.payload
}
