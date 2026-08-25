import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import { mapPublicProductVariantTableRow } from "@/core/helpers/products/mapPublicProductVariantTableRow"
import {
    IProductVariantTableDependencies,
    IGetProductVariantsByMeasurementEvent,
} from "@/functions/PublicApi/types/products"

/**
 * Tek bir ÖLÇÜNÜN varyantları — varyant detay sayfasının (`?m=`) veri kaynağı.
 *
 * Eskiden o sayfa tablo ucundan 500 varyant çekip İSTEMCİDE tek ölçüye
 * filtreliyordu; ihtiyacının onlarca katını taşıyordu (P1.8 F1.1).
 *
 * URL anahtarı (`m`) korunuyor: 16 yerde link kuruluyor ve dışarı çıkmış
 * bağlantılarda geçiyor. Anahtar → ölçü çözümü ölçü tablosu üzerinde yapılır.
 */
export const getProductVariantsByMeasurementHandler = (
    { productVariantRepository }: IProductVariantTableDependencies,
) => {
    return async (event: IGetProductVariantsByMeasurementEvent) => {
        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("productId required")

        const measurementKey = event.queryStringParameters?.m
        if (!measurementKey) throw new createError.BadRequest("m required")

        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        try {
            // PUBLIC: fiyat/tedarikçi çekilmez.
            const { rows, columns } = await productVariantRepository.getProductVariantsByMeasurementKey(
                productId,
                { measurementKey, locale },
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: rows.map((variant) => mapPublicProductVariantTableRow(variant, locale)),
                    columns,
                },
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get variants for measurement")
        }
    }
}
