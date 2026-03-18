import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductAttributeValueDependencies, IDeleteProductAttributeValueEvent
} from "@/functions/AdminApi/types/productAttributeValues"

export const deleteProductAttributeValueHandler = ({ productAttributeValueRepository }: IProductAttributeValueDependencies) => {
    return async (event: IDeleteProductAttributeValueEvent) => {
        const { id } = event.pathParameters

        await productAttributeValueRepository.deleteValue(id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { success: true }
        })
    }
}
