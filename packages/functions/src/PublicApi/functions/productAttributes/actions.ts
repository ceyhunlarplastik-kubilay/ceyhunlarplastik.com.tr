import { lambdaHandler } from "@/core/middy"
import { productAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"
import { listAttributesWithValuesHandler } from "@/functions/PublicApi/functions/productAttributes/handlers"
import { listAttributesWithValuesResponseValidator } from "@/functions/PublicApi/validators/productAttributes"
import type {
    IProductAttributeDependencies,
    IListAttributesWithValuesEvent,
} from "@/functions/PublicApi/types/productAttributes"

export const listAttributesWithValues = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository(),
        }

        return listAttributesWithValuesHandler(deps)(
            event as IListAttributesWithValuesEvent
        )
    },
    {
        auth: false,
        responseValidator: listAttributesWithValuesResponseValidator,
    }
)
