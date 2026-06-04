import { protectedApiClient } from "@/lib/http/client"
import type { CompanyContactListResponse } from "@/features/admin/companyContacts/api/types"

export async function getManagedCompanyContacts() {
    const res = await protectedApiClient.get<CompanyContactListResponse>("/sales/company-contacts")
    return res.data.payload
}
