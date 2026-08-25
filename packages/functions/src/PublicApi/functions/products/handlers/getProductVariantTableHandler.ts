import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { getSupportedLocale } from "@/core/i18n/locales"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { mapPublicProductVariantTableRow } from "@/core/helpers/products/mapPublicProductVariantTableRow"
import { buildVariantTableMeta } from "@/core/helpers/products/buildVariantTableMeta"
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
                // P1.8(e): frontend tabloyu tek seferde çeker (limit=500, client-side
                // sayfalama yok). Default maxLimit=100 100+ varyantlı üründe sessiz
                // kesme yapıyordu; payload güvenli DTO olduğu için 500'e çıkarıldı.
                // P1.8(d): bu sınır artık SQL'e iniyor — 500'den fazlası belleğe
                // hiç çekilmiyor.
                maxLimit: 500,
            })

        try {
            // P1.8(B0): PUBLIC — fiyat/tedarikçi çekilmez (includeListPrice yok).
            // P1.8(d): arama/sıralama/sayfalama ve çeviri daraltması SQL'de.
            const { rows, total, columns } = await productVariantRepository.getProductVariantTableData(
                productId,
                { locale, page, limit, search, order },
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    // Public DTO: yapı yalnız (variantSuppliers/fiyat YOK).
                    data: rows.map((variant) => mapPublicProductVariantTableRow(variant, locale)),
                    meta: buildVariantTableMeta({ page, limit, total, columns }),
                },
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get variant table")
        }
    }
}
