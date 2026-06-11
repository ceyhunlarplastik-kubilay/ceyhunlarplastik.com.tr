import { protectedApiClient } from "@/lib/http/client"
import type {
    CustomerVariantSpecialPrice,
    CustomerVariantPaymentScheduleStep,
    CustomerVariantSpecialPriceListResponse,
    CustomerVariantSpecialPriceResponse,
} from "@/features/admin/customers/api/types"

export type CustomerVariantSpecialPriceInput = {
    productVariantId?: string
    price?: number
    currency?: string
    minOrderQuantity?: number | null
    maxOrderQuantity?: number | null
    paymentTermDays?: number | null
    paymentTermLabel?: string | null
    paymentSchedule?: CustomerVariantPaymentScheduleStep[] | null
    validFrom?: string | null
    validUntil?: string | null
    taxIncluded?: boolean
    deliveryTerm?: string | null
    contractReference?: string | null
    note?: string | null
    internalNote?: string | null
    isActive?: boolean
}

export async function getCustomerVariantSpecialPrices(customerId: string) {
    const res = await protectedApiClient.get<CustomerVariantSpecialPriceListResponse>(
        `/sales/customers/${customerId}/special-prices`,
    )
    return res.data.payload
}

export async function createCustomerVariantSpecialPrice(input: {
    customerId: string
    data: CustomerVariantSpecialPriceInput & {
        productVariantId: string
        price: number
    }
}): Promise<CustomerVariantSpecialPrice> {
    const res = await protectedApiClient.post<CustomerVariantSpecialPriceResponse>(
        `/sales/customers/${input.customerId}/special-prices`,
        input.data,
    )
    return res.data.payload.specialPrice
}

export async function updateCustomerVariantSpecialPrice(input: {
    customerId: string
    specialPriceId: string
    data: CustomerVariantSpecialPriceInput
}): Promise<CustomerVariantSpecialPrice> {
    const res = await protectedApiClient.put<CustomerVariantSpecialPriceResponse>(
        `/sales/customers/${input.customerId}/special-prices/${input.specialPriceId}`,
        input.data,
    )
    return res.data.payload.specialPrice
}

export async function deactivateCustomerVariantSpecialPrice(input: {
    customerId: string
    specialPriceId: string
}): Promise<CustomerVariantSpecialPrice> {
    const res = await protectedApiClient.delete<CustomerVariantSpecialPriceResponse>(
        `/sales/customers/${input.customerId}/special-prices/${input.specialPriceId}`,
    )
    return res.data.payload.specialPrice
}
