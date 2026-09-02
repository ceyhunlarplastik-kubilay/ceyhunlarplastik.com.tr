import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { mapPublicProductVariantTableRow } from "@/core/helpers/products/mapPublicProductVariantTableRow"
import { buildVariantTableMeta } from "@/core/helpers/products/buildVariantTableMeta"
import { groupVariantTableRows } from "@/core/helpers/products/groupVariantTableRows"
import { IProductVariantTableDependencies, IGetProductVariantTableEvent } from "@/functions/PublicApi/types/products"

export const getProductVariantTableHandler = ({ productVariantRepository }: IProductVariantTableDependencies) => {
    return async (event: IGetProductVariantTableEvent) => {
        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("productId required")
        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        const { page, limit, search, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ["id"], // Custom sorting handled in memory
                defaultSort: "id",
                // Sınır artık ÖLÇÜ sayısına uygulanır (satır = ölçü), ham varyanta
                // değil — bir ürün modelinde ölçü sayısı varyant sayısından kat kat
                // azdır. 500 fazlasıyla yeterli ve sayfalama arayüzü de var.
                maxLimit: 500,
            })

        try {
            // P1.8(B0): PUBLIC — fiyat/tedarikçi çekilmez (includeListPrice yok).
            // P1.8(d): sayfalama ÖLÇÜ üzerinde; satır = ölçü, ham varyant değil.
            // Özet tablo YALNIZ zorunlu ölçülerle gruplanır: bir tedarikçi
            // kataloğunda opsiyonel ölçü girilmemişse (R20/D5/H17 ile R20/D5)
            // aksi hâlde iki ayrı satır olarak tekrar ederdi.
            const { rows, total, columns } = await productVariantRepository.getProductVariantTableData(
                productId,
                { locale, page, limit, search, order, requiredMeasurementColumnsOnly: true },
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    // Satırlar ölçüye göre gruplanır: aynı ölçünün tüm versiyonları
                    // (renk + hammadde) tek satırda toplanır. Gruplama eskiden RSC
                    // sayfa katmanındaydı; sunucuya inince sayfalama da doğru birime
                    // oturdu (bkz. groupVariantTableRows).
                    data: groupVariantTableRows(
                        rows.map((variant) => mapPublicProductVariantTableRow(variant, locale)),
                        { requiredMeasurementsOnly: true },
                    ),
                    meta: buildVariantTableMeta({ page, limit, total, columns }),
                },
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get variant table")
        }
    }
}
