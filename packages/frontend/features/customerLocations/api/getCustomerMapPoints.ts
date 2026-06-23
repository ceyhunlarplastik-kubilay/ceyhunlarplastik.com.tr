import { protectedApiClient } from "@/lib/http/client"
import type { CustomerMapResponse } from "@/features/customerLocations/types"

type Params = {
    north: number
    south: number
    east: number
    west: number
    status?: "LEAD" | "CUSTOMER"
    search?: string
    assignedSalesUserId?: string
}

export async function getCustomerMapPoints(params: Params) {
    const response = await protectedApiClient.get<CustomerMapResponse>("/sales/customers/map", {
        params,
    })

    return response.data.payload.data
}

