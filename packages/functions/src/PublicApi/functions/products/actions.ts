import { lambdaHandler } from "@/core/middy"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { listProductsHandler, getProductHandler, getProductBySlugHandler, getProductVariantTableHandler } from "@/functions/PublicApi/functions/products/handlers"
import { idValidator, slugValidator, listProductsResponseValidator, productResponseValidator, productVariantTableResponseValidator } from "@/functions/PublicApi/validators/products"
import type { IListProductsEvent, IGetProductEvent, IGetProductBySlugEvent, IGetProductVariantTableEvent } from "@/functions/PublicApi/types/products"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"

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

export const getProductBySlug = lambdaHandler(
    async (event) =>
        getProductBySlugHandler({
            productRepository: productRepository(),
        })(event as IGetProductBySlugEvent),
    {
        auth: false,
        requestValidator: slugValidator,
        responseValidator: productResponseValidator,
    }
)

export const getProductVariantTable = lambdaHandler(
    async (event) =>
        getProductVariantTableHandler({
            productVariantRepository: productVariantRepository(),
        })(event as IGetProductVariantTableEvent),
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: productVariantTableResponseValidator,
    }
)
