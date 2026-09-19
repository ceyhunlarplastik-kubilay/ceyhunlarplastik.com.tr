import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"
import type { CustomerPortalUserInviteFormValues } from "@/features/customerPortal/schema/customerPortalUserInvite"

/**
 * Satış temsilcisinin/müdürünün bir müşteriyi (öncelikle LEAD) portale davet
 * etmesi — `createPortalCustomerUser`ın (müşteri portalı, kişi kendi
 * meslektaşını davet eder) satış paneli karşılığı. Aynı form değerlerini
 * (`CustomerPortalUserInviteFormValues`) kullanır, bu yüzden mevcut
 * `CustomerPortalUserInviteDialog` aynen reuse edilebiliyor.
 */
export async function inviteManagedCustomer(customerId: string, input: CustomerPortalUserInviteFormValues) {
    const res = await protectedApiClient.post<CustomerResponse>(`/sales/customers/${customerId}/invite`, {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        customerContactTitle: input.customerContactTitle?.trim() || null,
        customerContactDepartment: input.customerContactDepartment?.trim() || null,
        isPrimaryCustomerContact: input.isPrimaryCustomerContact,
    })

    return res.data.payload.customer
}
