import { protectedApiClient } from "@/lib/http/client"
import type {
    ListLeadCustomersParams,
    ListLeadCustomersResponse,
} from "@/features/admin/leadCustomers/api/types"

export async function getManagedLeadCustomers(params: ListLeadCustomersParams) {
    const res = await protectedApiClient.get<ListLeadCustomersResponse>("/sales/lead-customers", { params })
    return res.data.payload
}
