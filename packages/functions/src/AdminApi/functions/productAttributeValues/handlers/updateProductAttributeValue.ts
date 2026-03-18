import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IUpdateProductAttributeValueEvent } from "@/functions/AdminApi/types/productAttributeValues"

export const updateProductAttributeValueHandler = ({ productAttributeValueRepository }: IProductAttributeValueDependencies) => {
    return async (event: IUpdateProductAttributeValueEvent) => {
        const { id } = event.pathParameters
        const body = event.body

        try {
            const value = await productAttributeValueRepository.updateValue(id, body)

            return apiResponseDTO({
                statusCode: 200,
                payload: { value }
            })
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to update value");
        }
    }
}
