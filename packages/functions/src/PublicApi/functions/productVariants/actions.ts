import { lambdaHandler } from "@/core/middy"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository";
import { materialRepository } from "@/core/helpers/prisma/materials/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";

import {
    getProductVariantHandler,
    listProductVariantsHandler
} from "@/functions/PublicApi/functions/productVariants/handlers"
import {
    idValidator,
    getProductVariantResponseValidator,
    listProductVariantResponseValidator,
} from "@/functions/PublicApi/validators/productVariants"
import type {
    IProductVariantDependencies,
    IGetProductVariantEvent,
    IListProductVariantsEvent,
} from "@/functions/PublicApi/types/productVariants"

const getDeps = (): IProductVariantDependencies => ({
    productVariantRepository: productVariantRepository(),
    productRepository: productRepository(),
    materialRepository: materialRepository(),
    supplierRepository: supplierRepository(),
})

export const getProductVariant = lambdaHandler(
    async (event) => {
        return getProductVariantHandler(getDeps())(
            event as IGetProductVariantEvent
        )
    },
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: getProductVariantResponseValidator,
    }
)

export const listProductVariants = lambdaHandler(
    async (event) => {
        return listProductVariantsHandler(getDeps())
            (
                event as IListProductVariantsEvent
            )
    },
    {
        auth: false,
        responseValidator: listProductVariantResponseValidator,
    }
)
