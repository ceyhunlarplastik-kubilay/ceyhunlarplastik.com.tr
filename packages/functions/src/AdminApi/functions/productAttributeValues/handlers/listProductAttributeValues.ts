import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IListProductAttributeValuesEvent } from "@/functions/AdminApi/types/productAttributeValues"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { getSupportedLocale } from "@/core/i18n/locales"

export const listProductAttributeValuesHandler = ({
    productAttributeValueRepository
}: IProductAttributeValueDependencies) => {

    return async (event: IListProductAttributeValuesEvent) => {

        // GET /product-attribute-values?attributeId=<uuid> path parametresi taşımaz,
        // GET /product-attribute-values/{id} ise attribute id'yi {id} olarak verir.
        const attributeId =
            event.pathParameters?.attributeId ??
            event.pathParameters?.id ??
            event.queryStringParameters?.attributeId

        if (!attributeId) {
            return apiResponseDTO({
                statusCode: 400,
                payload: { message: "attributeId is required (path parameter or ?attributeId= query string)" }
            })
        }

        const locale = getSupportedLocale(event.queryStringParameters?.locale)
        const values = await productAttributeValueRepository.listValues(attributeId, locale)
        const data = values.map((value) => ({
            ...value,
            assets: ((value as any).assets ?? []).map((asset: any) => ({
                ...asset,
                url: buildAssetUrl(asset.key),
            })),
        }))

        return apiResponseDTO({
            statusCode: 200,
            payload: { data }
        })
    }
}
