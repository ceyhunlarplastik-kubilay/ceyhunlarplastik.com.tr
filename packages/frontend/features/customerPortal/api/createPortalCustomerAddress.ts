"use client"

import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"
import type { addressDraftSchema } from "@/features/customerPortal/components/requestComposer/schema"
import { normalizeAddressPayload } from "@/features/customerLocations/lib/addressPayload"
import type { z } from "zod"

export async function createPortalCustomerAddress(input: z.infer<typeof addressDraftSchema>) {
    const res = await protectedApiClient.post<CustomerResponse>("/portal/customer/addresses", normalizeAddressPayload(input))
    return res.data.payload.customer
}
