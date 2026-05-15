import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const deleteProductAttributeValueHandler = ({ productAttributeValueRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        await productAttributeValueRepository.deleteValue(id);
        return apiResponseDTO({
            statusCode: 200,
            payload: { success: true }
        });
    };
};
