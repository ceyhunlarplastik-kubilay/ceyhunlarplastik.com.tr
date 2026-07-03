import { lambdaHandler } from "@/core/middy"
import { productAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"
import {
    createProductAttributeHandler,
    listProductAttributesHandler,
    getProductAttributeHandler,
    deleteProductAttributeHandler,
    updateProductAttributeHandler,
    listAttributesWithValuesHandler,
} from "@/functions/AdminApi/functions/productAttributes/handlers";
import {
    createProductAttributeValidator,
    deleteProductAttributeValidator,
    updateProductAttributeValidator,
    productAttributeResponseValidator,
    listProductAttributesResponseValidator,
    listAttributesWithValuesResponseValidator,
} from "@/functions/AdminApi/validators/productAttributes"
import type {
    IProductAttributeDependencies,
    ICreateProductAttributeEvent,
    IListProductAttributesEvent,
    IGetProductAttributeEvent,
    IDeleteProductAttributeEvent,
    IUpdateProductAttributeEvent,
} from "@/functions/AdminApi/types/productAttributes"

const productAttributeManagerGroups = ["admin", "content_editor"]

export const createProductAttribute = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository()
        }

        return createProductAttributeHandler(deps)(
            event as ICreateProductAttributeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: productAttributeManagerGroups },
        requestValidator: createProductAttributeValidator,
    }
)

export const listProductAttributes = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository()
        }

        return listProductAttributesHandler(deps)(
            event as IListProductAttributesEvent
        )
    },
    {
        auth: { requiredPermissionGroups: productAttributeManagerGroups },
        responseValidator: listProductAttributesResponseValidator,
    }
)

export const listAttributesWithValues = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository()
        }

        return listAttributesWithValuesHandler(deps)(
            event as IListProductAttributesEvent
        )
    },
    {
        auth: { requiredPermissionGroups: productAttributeManagerGroups },
        responseValidator: listAttributesWithValuesResponseValidator,
    }
)

export const getProductAttribute = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository()
        }

        return getProductAttributeHandler(deps)(
            event as IGetProductAttributeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: productAttributeManagerGroups },
        responseValidator: productAttributeResponseValidator,
    }
)

export const deleteProductAttribute = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository()
        }

        return deleteProductAttributeHandler(deps)(
            event as IDeleteProductAttributeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: productAttributeManagerGroups },
        requestValidator: deleteProductAttributeValidator,
    }
)

export const updateProductAttribute = lambdaHandler(
    async (event) => {
        const deps: IProductAttributeDependencies = {
            productAttributeRepository: productAttributeRepository()
        }
        return updateProductAttributeHandler(deps)(
            event as IUpdateProductAttributeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: productAttributeManagerGroups },
        requestValidator: updateProductAttributeValidator,
    }
)
