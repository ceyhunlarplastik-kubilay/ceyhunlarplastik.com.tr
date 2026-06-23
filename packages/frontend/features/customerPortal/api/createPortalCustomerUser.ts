"use client"

import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"
import type { CustomerPortalUserInviteFormValues } from "@/features/customerPortal/schema/customerPortalUserInvite"

export async function createPortalCustomerUser(input: CustomerPortalUserInviteFormValues) {
    const res = await protectedApiClient.post<CustomerResponse>("/portal/customer/users", {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        customerContactTitle: input.customerContactTitle?.trim() || null,
        customerContactDepartment: input.customerContactDepartment?.trim() || null,
        isPrimaryCustomerContact: input.isPrimaryCustomerContact,
    })

    return res.data.payload.customer
}
