import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listProductAttributeValuesHandler = ({ productAttributeValueRepository }) => {
    return async (event) => {
        const attributeId = event.pathParameters?.attributeId ??
            event.pathParameters?.id;
        if (!attributeId) {
            return apiResponseDTO({
                statusCode: 400,
                payload: { message: "attributeId (or id) path parameter is required" }
            });
        }
        const data = await productAttributeValueRepository.listValues(attributeId);
        return apiResponseDTO({
            statusCode: 200,
            payload: { data }
        });
    };
};
