import { adminApiClient, protectedApiClient } from "@/lib/http/client"
import type { ProductMatchedCustomersResponse } from "@/features/productMatchedCustomers/api/types"

/**
 * Aynı yetenek iki boundary'de yayınlanıyor; hangisinin çağrılacağını panel
 * belirler. Sunucu tarafında handler ve şemalar ORTAK
 * (`functions/shared/crm/productMatchedCustomers`) — tek fark kapsam:
 * admin/owner tüm müşterileri, satış temsilcisi kendi portföyü + atanmamışları görür.
 */
export type ProductMatchedCustomersScope = "sales" | "admin"

export type GetProductMatchedCustomersParams = {
    productId: string
    scope?: ProductMatchedCustomersScope
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
    scope = "sales",
    ...params
}: GetProductMatchedCustomersParams) {
    const client = scope === "admin" ? adminApiClient : protectedApiClient
    const path = scope === "admin"
        ? `/products/${productId}/matched-customers`
        : `/sales/products/${productId}/matched-customers`

    const res = await client.get<ProductMatchedCustomersResponse>(path, {
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
    })

    return res.data.payload
}
