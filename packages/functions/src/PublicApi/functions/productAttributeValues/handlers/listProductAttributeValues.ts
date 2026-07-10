import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IListProductAttributeValuesEvent } from "@/functions/PublicApi/types/productAttributeValues"

export const listProductAttributeValuesHandler = ({
    productAttributeValueRepository
}: IProductAttributeValueDependencies) => {

    return async (event: IListProductAttributeValuesEvent) => {
        console.log("listProductAttributeValuesHandler", event.pathParameters);

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

        const data = await productAttributeValueRepository.listValues(attributeId)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data }
        })
    }
}
