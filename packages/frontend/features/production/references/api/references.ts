import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type {
    ReferenceCustomer,
    ReferenceProduct,
    ReferenceProductSizes,
    ReferenceProductVariants,
} from "@/features/production/references/api/types"

/** `moldable`: yalnız üretilebilir ölçüsü ve varyantı olan ürün modelleri (üretim emri). */
export async function listReferenceProducts(options: { moldable?: boolean } = {}): Promise<ReferenceProduct[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ products: ReferenceProduct[] }>>(
        "/production/references/products",
        { params: options.moldable ? { moldable: "true" } : undefined },
    )
    return res.data.payload.products
}

export async function getReferenceProductVariants(productId: string): Promise<ReferenceProductVariants> {
    const res = await protectedApiClient.get<ApiEnvelope<ReferenceProductVariants>>(
        `/production/references/products/${productId}/variants`,
    )
    return res.data.payload
}

export async function searchReferenceCustomers(search: string): Promise<ReferenceCustomer[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ customers: ReferenceCustomer[] }>>(
        "/production/references/customers",
        { params: search ? { q: search } : undefined },
    )
    return res.data.payload.customers
}

export async function getReferenceProductSizes(productId: string): Promise<ReferenceProductSizes> {
    const res = await protectedApiClient.get<ApiEnvelope<ReferenceProductSizes>>(
        `/production/references/products/${productId}/sizes`,
    )
    return res.data.payload
}
