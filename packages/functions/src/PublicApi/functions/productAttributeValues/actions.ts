import { lambdaHandler } from "@/core/middy"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { listProductAttributeValuesHandler } from "@/functions/PublicApi/functions/productAttributeValues/handlers"
import { listProductAttributeValueResponseValidator } from "@/functions/PublicApi/validators/productAttributeValues"

export const listProductAttributeValues = lambdaHandler(
    async (event) => {
        return listProductAttributeValuesHandler({
            productAttributeValueRepository: productAttributeValueRepository()
        })(event as any)
    },
    {
        auth: false,
        responseValidator: listProductAttributeValueResponseValidator,
    }
)
