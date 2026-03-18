import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IListProductAttributeValuesEvent } from "@/functions/AdminApi/types/productAttributeValues"

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

        const data = await productAttributeValueRepository.listValues(attributeId)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data }
        })
    }
}
