import { protectedApiClient } from "@/lib/http/client"
import type { CustomerResponse } from "@/features/admin/customers/api/types"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { normalizeAddressPayload } from "@/features/customerLocations/lib/addressPayload"

export async function createManagedCustomerAddress(customerId: string, input: AddressDraftFormValues) {
    const response = await protectedApiClient.post<CustomerResponse>(
        `/sales/customers/${customerId}/addresses`,
        normalizeAddressPayload(input),
    )

    return response.data.payload.customer
}

