import { protectedApiClient } from "@/lib/http/client"
import type { ProductMatchedCustomersResponse } from "@/features/productMatchedCustomers/api/types"

/**
 * Panel ön eki uca gömülü: bugün yalnız satış paneli açık, diğer paneller
 * eklendiğinde aynı çağrı ön eki değiştirerek yeniden kullanılır.
 */
export type MatchedCustomersEndpointPrefix = "sales"

export type GetProductMatchedCustomersParams = {
    productId: string
    endpointPrefix?: MatchedCustomersEndpointPrefix
    page?: number
    limit?: number
    search?: string
    status?: "LEAD" | "CUSTOMER"
    sort?: "companyName" | "fullName" | "createdAt" | "status"
    order?: "asc" | "desc"
    /** Adres filtresi — ülke / il / ilçe (normalize FK id'leri). */
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
}

export async function getProductMatchedCustomers({
    productId,
    endpointPrefix = "sales",
    ...params
}: GetProductMatchedCustomersParams) {
    const res = await protectedApiClient.get<ProductMatchedCustomersResponse>(
        `/${endpointPrefix}/products/${productId}/matched-customers`,
        {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                sort: params.sort ?? "companyName",
                order: params.order ?? "asc",
                ...(params.search ? { search: params.search } : {}),
                ...(params.status ? { status: params.status } : {}),
                ...(params.countryId ? { countryId: params.countryId } : {}),
                ...(params.stateId ? { stateId: params.stateId } : {}),
                ...(params.cityId ? { cityId: params.cityId } : {}),
            },
        },
    )

    return res.data.payload
}
