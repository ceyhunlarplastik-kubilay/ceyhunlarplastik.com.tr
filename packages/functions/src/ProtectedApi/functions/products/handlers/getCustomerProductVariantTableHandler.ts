import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { buildVariantTableMeta } from "@/core/helpers/products/buildVariantTableMeta"
import { groupVariantTableRows } from "@/core/helpers/products/groupVariantTableRows"
import { mapCustomerProductVariantTableRow } from "@/core/helpers/products/mapPublicProductVariantTableRow"
import { normalizeCustomerDiscountPercent } from "@/core/helpers/pricing/customerPricing"
import { IGetProductVariantTableEvent } from "@/functions/PublicApi/types/products"
import { ICustomerProductVariantTableDependencies } from "@/functions/ProtectedApi/types/products"

/**
 * CUSTOMER varyant tablosu (P1.8 B0 + P2.8a).
 *
 * Public handler ile AYNI yapısal mantığı (buildVariantTableMeta)
 * paylaşır; farkı: repository `includeListPrice:true` ile çağrılır ve customer
 * DTO'su liste fiyatı alanlarını taşır. Tedarikçi kimliği/maliyeti taşınmaz.
 * ProtectedApi (giriş yapmış) olduğundan fiyat public'e sızmaz.
 *
 * P2.8(a): Müşterinin genel indirim yüzdesi de bu yanıtta döner. Sayfa zaten bu
 * endpoint'i çağırdığı için EK round-trip yok; frontend'in doğrudan prisma'ya
 * gitmesi (AGENTS.md veri akışı ihlali) böylece ortadan kalktı.
 */
export const getCustomerProductVariantTableHandler = ({ productVariantRepository, customerRepository }: ICustomerProductVariantTableDependencies) => {
    return async (event: IGetProductVariantTableEvent) => {
        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("productId required")
        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        const { page, limit, search, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ["id"],
                defaultSort: "id",
                maxLimit: 500,
            })

        // Yalnız portal müşterisinde doludur; admin/sales çağrısında null döner.
        const customerId = event.user?.customerId

        try {
            const [table, pricingContext] = await Promise.all([
                productVariantRepository.getProductVariantTableData(productId, {
                    includeListPrice: true,
                    locale, page, limit, search, order,
                    // Public tarafla AYNI: özet tablo yalnız zorunlu ölçülerle
                    // gruplanır (bkz. groupVariantTableRows / public handler).
                    requiredMeasurementColumnsOnly: true,
                }),
                customerId
                    ? customerRepository.getCustomerPricingContext(customerId)
                    : Promise.resolve(null),
            ])

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    // Public tarafla AYNI gruplama: satır = ölçü, yalnız zorunlu
                    // ölçülerle (bkz. groupVariantTableRows).
                    data: groupVariantTableRows(
                        table.rows.map((variant) => mapCustomerProductVariantTableRow(variant, locale)),
                        { requiredMeasurementsOnly: true },
                    ),
                    meta: buildVariantTableMeta({
                        page, limit, total: table.total, columns: table.columns,
                    }),
                    customerDiscountPercent: normalizeCustomerDiscountPercent(pricingContext?.generalDiscountPercent),
                },
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get customer variant table")
        }
    }
}
