import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IListProductAttributeValuesEvent } from "@/functions/AdminApi/types/productAttributeValues"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"

export const listProductAttributeValuesHandler = ({
    productAttributeValueRepository
}: IProductAttributeValueDependencies) => {

    return async (event: IListProductAttributeValuesEvent) => {

        const attributeId =
            event.pathParameters?.attributeId ??
            (event.pathParameters as { id?: string } | undefined)?.id

        if (!attributeId) {
            return apiResponseDTO({
                statusCode: 400,
                payload: { message: "attributeId (or id) path parameter is required" }
            })
        }

        const values = await productAttributeValueRepository.listValues(attributeId)
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
