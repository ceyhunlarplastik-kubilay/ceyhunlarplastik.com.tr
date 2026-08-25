import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import { mapCustomerProductVariantTableRow } from "@/core/helpers/products/mapPublicProductVariantTableRow"
import { normalizeCustomerDiscountPercent } from "@/core/helpers/pricing/customerPricing"
import { IGetProductVariantsByMeasurementEvent } from "@/functions/PublicApi/types/products"
import { ICustomerProductVariantTableDependencies } from "@/functions/ProtectedApi/types/products"

/**
 * Tek ÖLÇÜNÜN varyantları — portal varyant detay sayfasının veri kaynağı.
 *
 * Public muadiliyle aynı okuma yolunu kullanır; farkı liste fiyatı overlay'i ve
 * müşterinin genel indirim yüzdesi (fiyat zinciri kuralı DEĞİŞMEZ, yalnız burada
 * taşınır — bkz. customerPricing).
 */
export const getCustomerProductVariantsByMeasurementHandler = (
    { productVariantRepository, customerRepository }: ICustomerProductVariantTableDependencies,
) => {
    return async (event: IGetProductVariantsByMeasurementEvent) => {
        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("productId required")

        const measurementKey = event.queryStringParameters?.m
        if (!measurementKey) throw new createError.BadRequest("m required")

        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        // Yalnız portal müşterisinde doludur; admin/sales çağrısında null döner.
        const customerId = event.user?.customerId

        try {
            const [result, pricingContext] = await Promise.all([
                productVariantRepository.getProductVariantsByMeasurementKey(productId, {
                    measurementKey,
                    locale,
                    includeListPrice: true,
                }),
                customerId
                    ? customerRepository.getCustomerPricingContext(customerId)
                    : Promise.resolve(null),
            ])

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.rows.map((variant) =>
                        mapCustomerProductVariantTableRow(variant, locale),
                    ),
                    columns: result.columns,
                    customerDiscountPercent: normalizeCustomerDiscountPercent(
                        pricingContext?.generalDiscountPercent,
                    ),
                },
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get variants for measurement")
        }
    }
}
