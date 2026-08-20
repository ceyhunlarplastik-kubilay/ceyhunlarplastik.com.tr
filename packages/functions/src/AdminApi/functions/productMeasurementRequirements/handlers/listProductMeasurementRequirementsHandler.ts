import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductMeasurementRequirementDependencies,
    IListMeasurementRequirementsEvent,
} from "@/functions/AdminApi/types/productMeasurementRequirements"

export const listProductMeasurementRequirementsHandler = ({
    productMeasurementRequirementRepository,
    productRepository,
}: IProductMeasurementRequirementDependencies) => {
    return async (event: IListMeasurementRequirementsEvent) => {
        const { id: productId } = event.pathParameters

        const product = await productRepository.getProduct(productId)
        if (!product) throw new createError.NotFound("Product not found")

        const requirements = await productMeasurementRequirementRepository.listByProduct(productId)

        return apiResponseDTO({
            statusCode: 200,
            payload: { requirements },
        })
    }
}
