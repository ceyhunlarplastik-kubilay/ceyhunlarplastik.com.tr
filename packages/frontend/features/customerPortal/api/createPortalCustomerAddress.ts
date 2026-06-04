"use client"

import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"
import type { addressDraftSchema } from "@/features/customerPortal/components/requestComposer/schema"
import type { z } from "zod"

function normalizeOptional(value?: string | null) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

function normalizeAddressPayload(input: z.infer<typeof addressDraftSchema>) {
    return {
        label: input.label.trim(),
        contactName: normalizeOptional(input.contactName),
        phone: normalizeOptional(input.phone),
        email: normalizeOptional(input.email),
        countryId: input.countryId ?? null,
        stateId: input.stateId ?? null,
        cityId: input.cityId ?? null,
        country: normalizeOptional(input.country) || "Turkiye",
        stateName: normalizeOptional(input.stateName),
        city: input.city.trim(),
        district: normalizeOptional(input.district),
        line1: input.line1.trim(),
        line2: normalizeOptional(input.line2),
        postalCode: normalizeOptional(input.postalCode),
        taxOffice: normalizeOptional(input.taxOffice),
        taxNumber: normalizeOptional(input.taxNumber),
        isPrimary: input.isPrimary,
        isBilling: input.isBilling,
        isShipping: input.isShipping,
        note: normalizeOptional(input.note),
    }
}

export async function createPortalCustomerAddress(input: z.infer<typeof addressDraftSchema>) {
    const res = await protectedApiClient.post<CustomerResponse>("/portal/customer/addresses", normalizeAddressPayload(input))
    return res.data.payload.customer
}
