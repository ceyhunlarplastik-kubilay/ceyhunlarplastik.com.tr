import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeDependencies, IListProductAttributesEvent } from "@/functions/AdminApi/types/productAttributes"

export const listAttributesWithValuesHandler = ({
    productAttributeRepository,
}: IProductAttributeDependencies) => {
    return async (_event: IListProductAttributesEvent) => {
        // _event → unused param ama type consistency korunur ✅
        try {
            const data = await productAttributeRepository.listAttributesForFilter()

            return apiResponseDTO({
                statusCode: 200,
                payload: { data },
            })
        } catch (error) {
            console.error(error)
            throw new createError.InternalServerError("Failed to list attributes with values")
        }
    }
}
