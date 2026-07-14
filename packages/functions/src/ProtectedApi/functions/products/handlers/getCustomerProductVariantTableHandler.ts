import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { dedupeAndPaginateVariantTable } from "@/core/helpers/products/dedupeVariantTable"
import { mapCustomerProductVariantTableRow } from "@/core/helpers/products/mapPublicProductVariantTableRow"
import { IProductVariantTableDependencies, IGetProductVariantTableEvent } from "@/functions/PublicApi/types/products"

/**
 * CUSTOMER varyant tablosu (P1.8 B0).
 *
 * Public handler ile AYNI yapısal mantığı (dedupeAndPaginateVariantTable)
 * paylaşır; farkı: repository `includeListPrice:true` ile çağrılır ve customer
 * DTO'su liste fiyatı alanlarını taşır. Tedarikçi kimliği/maliyeti taşınmaz.
 * ProtectedApi (giriş yapmış) olduğundan fiyat public'e sızmaz.
 */
export const getCustomerProductVariantTableHandler = ({ productVariantRepository }: IProductVariantTableDependencies) => {
    return async (event: IGetProductVariantTableEvent) => {
        const productId = event.pathParameters?.id
        if (!productId) throw new createError.BadRequest("productId required")

        const { page, limit, search, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ["id"],
                defaultSort: "id",
                maxLimit: 500,
            })

        try {
            const rawVariants = await productVariantRepository.getProductVariantTableData(productId, { includeListPrice: true })

            const { paginated, meta } = dedupeAndPaginateVariantTable(rawVariants, { page, limit, search, order })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: paginated.map(mapCustomerProductVariantTableRow),
                    meta,
                },
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("Failed to get customer variant table")
        }
    }
}
