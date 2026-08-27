import createError from "http-errors"

import {
    PRODUCT_MATCHED_CUSTOMER_SORT_FIELDS,
    listProductMatchedCustomers,
} from "@/core/helpers/crm/getProductMatchedCustomers"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { CustomerStatus } from "@/prisma/generated/prisma/enums"

/**
 * ÜRÜN → MÜŞTERİ. Müşteri portalındaki "İlgili Ürünler"in tersi: kullanıcı
 * elindeki ürün modeli için gidebileceği müşteri/potansiyel müşteri listesini
 * görür. Eşleşme kuralı `core/helpers/crm/customerProfileMatching.ts`'te tek yerde.
 *
 * Handler PAYLAŞILAN: aynı uç iki boundary'de yayınlanıyor
 * (`GET /sales/products/{id}/matched-customers` ve `GET /products/{id}/matched-customers`).
 * Boundary'ler arasındaki TEK fark kapsam daraltması; o da `resolveScope` ile
 * dışarıdan veriliyor. Kopyalanan bir handler, iki panelin aynı ürün için farklı
 * müşteri listesi göstermesiyle sonuçlanırdı.
 */

export type IListProductMatchedCustomersEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string },
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        status?: CustomerStatus
        assignedSalesUserId?: string
        countryId?: string
        stateId?: string
        cityId?: string
    }
>

type Requester = NonNullable<IListProductMatchedCustomersEvent["user"]>

export type ProductMatchedCustomersScope = {
    /** "Kendi müşterileri + atanmamışlar" — satış temsilcisi kapsamı. */
    salesScopeUserId?: string
    /** Açık temsilci filtresi — yönetici rolleri için. */
    assignedSalesUserId?: string
}

function toPositiveInt(raw?: string) {
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export const productMatchedCustomersHandler = (
    resolveScope: (requester: Requester, event: IListProductMatchedCustomersEvent) => ProductMatchedCustomersScope,
) => {
    return async (event: IListProductMatchedCustomersEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("Product id is required")

        // maxLimit 100 değil 200: harita görünümü sayfalanmaz, görünen tüm
        // eşleşmeleri tek seferde pin'ler. Satır DAR olduğu için payload küçük.
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: PRODUCT_MATCHED_CUSTOMER_SORT_FIELDS,
            defaultSort: "companyName",
            maxLimit: 200,
        })

        const result = await listProductMatchedCustomers({
            productIds: [productId],
            page,
            limit,
            search,
            sort,
            order,
            status: event.queryStringParameters?.status,
            countryId: toPositiveInt(event.queryStringParameters?.countryId),
            stateId: toPositiveInt(event.queryStringParameters?.stateId),
            cityId: toPositiveInt(event.queryStringParameters?.cityId),
            ...resolveScope(requester, event),
        })

        return apiResponseDTO({ statusCode: 200, payload: result })
    }
}

/**
 * Satış paneli kapsamı: temsilci KENDİ müşterileri + HENÜZ ATANMAMIŞ kayıtları
 * görür. `listManagedCustomers`'ın katı "yalnız kendi portföyü" kuralı burada
 * kopyalanmadı: potansiyel müşteriler veri girişi panelinden temsilcisiz
 * giriliyor, o kural listenin LEAD tarafını tamamen boşaltırdı. Başkasının
 * müşterisi yine görünmez. Yönetici rolleri tümünü görür.
 */
export const salesProductMatchedCustomersScope = (
    requester: Requester,
    event: IListProductMatchedCustomersEvent,
): ProductMatchedCustomersScope =>
    requester.isSales
        ? { salesScopeUserId: requester.id }
        : requester.isOwner || requester.isAdmin || requester.isSalesDirector
            ? { assignedSalesUserId: event.queryStringParameters?.assignedSalesUserId }
            : {}

/** Admin paneli kapsamı: tüm müşteriler; istenirse temsilciye filtrelenir. */
export const adminProductMatchedCustomersScope = (
    _requester: Requester,
    event: IListProductMatchedCustomersEvent,
): ProductMatchedCustomersScope => ({
    assignedSalesUserId: event.queryStringParameters?.assignedSalesUserId,
})
