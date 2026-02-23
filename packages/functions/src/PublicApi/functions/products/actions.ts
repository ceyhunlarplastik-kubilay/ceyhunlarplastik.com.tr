import { lambdaHandler } from "@/core/middy"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { listProductsHandler, getProductHandler } from "@/functions/PublicApi/functions/products/handlers"
import { idValidator, listProductsResponseValidator, productResponseValidator } from "@/functions/PublicApi/validators/products"
import type { IListProductsEvent, IGetProductEvent } from "@/functions/PublicApi/types/products"

export const listProducts = lambdaHandler(
    async (event) =>
        listProductsHandler({
            productRepository: productRepository(),
            categoryRepository: categoryRepository(),
        })(event as IListProductsEvent),
    {
        auth: false,
        responseValidator: listProductsResponseValidator,
    }
)

export const getProduct = lambdaHandler(
    async (event) =>
        getProductHandler({
            productRepository: productRepository(),
        })(event as IGetProductEvent),
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: productResponseValidator,
    }
)
