import { lambdaHandler } from "@/core/middy"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { listProductAttributeValuesHandler } from "@/functions/PublicApi/functions/productAttributeValues/handlers"

export const listProductAttributeValues = lambdaHandler(
    async (event) => {
        return listProductAttributeValuesHandler({
            productAttributeValueRepository: productAttributeValueRepository()
        })(event as any)
    },
    { auth: false }
)
