import { lambdaHandler } from "@/core/middy"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { listProductsHandler } from "@/functions/AdminApi/functions/products/handlers";
// import { createProductValidator, updateProductValidator } from "@/functions/AdminApi/validators/products"
import type {
    IListProductsDependencies,
    IListProductsEvent,
} from "@/functions/AdminApi/types/products"

export const listProducts = lambdaHandler(
    async (event) => {
        const deps: IListProductsDependencies = {
            productRepository: productRepository()
        }

        return listProductsHandler(deps)(
            event as IListProductsEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] }
    }
)
