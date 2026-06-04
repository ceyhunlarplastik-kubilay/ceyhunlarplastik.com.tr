import { adminApiClient } from "@/lib/http/client"
import type {
    CompanyContact,
    CompanyContactInput,
    CompanyContactListResponse,
    CompanyContactResponse,
} from "@/features/admin/companyContacts/api/types"

export type CompanyContactListParams = {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
}

export async function listCompanyContacts(params: CompanyContactListParams = {}) {
    const res = await adminApiClient.get<CompanyContactListResponse>("/company-contacts", {
        params,
    })
    return res.data.payload
}

export async function createCompanyContact(input: CompanyContactInput): Promise<CompanyContact> {
    const res = await adminApiClient.post<CompanyContactResponse>("/company-contacts", input)
    return res.data.payload.companyContact
}

export async function updateCompanyContact(
    id: string,
    input: Partial<CompanyContactInput>,
): Promise<CompanyContact> {
    const res = await adminApiClient.put<CompanyContactResponse>(`/company-contacts/${id}`, input)
    return res.data.payload.companyContact
}
