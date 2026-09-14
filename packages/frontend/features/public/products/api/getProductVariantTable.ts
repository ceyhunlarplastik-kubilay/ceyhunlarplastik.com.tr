import { publicApiClient } from "@/lib/http/client"
import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"
import type { ApiEnvelope } from "@/lib/http/types"

/**
 * `/products/{id}/variant-table` satır başına TEK varyant DEĞİL, ÖLÇÜYE göre
 * GRUPLANMIŞ satır döner (`groupVariantTableRows`, P1.8(d)) — bu dosya eskiden
 * yanıtı düz `VariantTableData[]` olarak tipliyordu (yanlış; sunucu tarafı eşdeğeri
 * `features/public/products/server/getProductVariantTable.ts` bunu doğru
 * tipliyordu). Bu yanlış tip, `useProductVariantTable`'ı tüketen 4 ekranın
 * (varyant seçimi gereken kampanya/özel fiyat/tanımlı-varyant yüzeyleri)
 * `variant.id`/`.fullCode` okuyup `undefined` almasına yol açıyordu — bkz.
 * `flattenGroupedVariantOptions`.
 */
type ProductVariantTableResponse = ApiEnvelope<{
    data: GroupedMeasurementOption[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
        columns?: string[]
    }
}>

export async function getProductVariantTable(
    productId: string,
    options: { locale?: string } = {},
): Promise<GroupedMeasurementOption[]> {
    const res = await publicApiClient.get<ProductVariantTableResponse>(
        `/products/${productId}/variant-table`,
        {
            params: {
                limit: 500,
                locale: options.locale ?? "tr",
            },
        },
    )

    return res.data.payload.data ?? []
}
