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



/* import { lambdaHandler } from "@/core/middy"
import { productAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"
import { listAttributesWithValuesHandler } from "@/functions/PublicApi/functions/productAttributes/handlers"
import { listAttributesWithValuesResponseValidator } from "@/functions/PublicApi/validators/productAttributes"
import type {
    IProductAttributeDependencies,
    IListAttributesWithValuesEvent,
} from "@/functions/PublicApi/types/productAttributes"
import { CacheHelper } from "@/core/helpers/cache/cacheHelper"
import { ListAttributesWithValuesParams } from "@/core/types/api/productAttributes"

const cacheKey = (params: ListAttributesWithValuesParams) =>
    `product-attributes:with-values:${JSON.stringify(params)}`

const cache = new CacheHelper()

export const listAttributesWithValues = lambdaHandler(
    async (event) => {
        const params = event.body
        const cached = await cache.get(cacheKey(params))

        if (cached) {
            return cached
        }

        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository(),
        }

        const result = await listAttributesWithValuesHandler(deps)(
            event as IListAttributesWithValuesEvent
        )

        await cache.set(cacheKey(params), result)

        return result
    },
    {
        auth: false,
        responseValidator: listAttributesWithValuesResponseValidator,
    }
)
 */