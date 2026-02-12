
import { lambdaHandler } from "@/core/middy"
import { productSupplierRepository } from "@/core/helpers/prisma/productSuppliers/repository"
import {
    createProductSupplierHandler,
    getProductSupplierHandler,
    listProductSuppliersHandler,
    deleteProductSupplierHandler,
    updateProductSupplierHandler,
} from "@/functions/AdminApi/functions/productSupplier/handlers";
import {
    createProductSupplierValidator,
    getProductSupplierValidator,
    deleteProductSupplierValidator,
    updateProductSupplierValidator,
} from "@/functions/AdminApi/validators/productSuppliers"
import type {
    ICreateProductSupplierDependencies,
    ICreateProductSupplierEvent,
    IGetProductSupplierDependencies,
    IGetProductSupplierEvent,
    IListProductSuppliersDependencies,
    IListProductSuppliersEvent,
    IDeleteProductSupplierDependencies,
    IDeleteProductSupplierEvent,
    IUpdateProductSupplierDependencies,
    IUpdateProductSupplierEvent,
} from "@/functions/AdminApi/types/productSuppliers"

export const createProductSupplier = lambdaHandler(
    async (event) => {
        const deps: ICreateProductSupplierDependencies = {
            productSupplierRepository: productSupplierRepository()
        }
        return createProductSupplierHandler(deps)(
            event as ICreateProductSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductSupplierValidator,
    }
)

export const getProductSupplier = lambdaHandler(
    async (event) => {
        const deps: IGetProductSupplierDependencies = {
            productSupplierRepository: productSupplierRepository()
        }
        return getProductSupplierHandler(deps)(
            event as IGetProductSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: getProductSupplierValidator,
    }
)

export const listProductSuppliers = lambdaHandler(
    async (event) => {
        const deps: IListProductSuppliersDependencies = {
            productSupplierRepository: productSupplierRepository()
        }
        return listProductSuppliersHandler(deps)
            (
                event as IListProductSuppliersEvent
            )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
    }
)

export const deleteProductSupplier = lambdaHandler(
    async (event) => {
        const deps: IDeleteProductSupplierDependencies = {
            productSupplierRepository: productSupplierRepository()
        }
        return deleteProductSupplierHandler(deps)(
            event as IDeleteProductSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: deleteProductSupplierValidator,
    }
)

export const updateProductSupplier = lambdaHandler(
    async (event) => {
        const deps: IUpdateProductSupplierDependencies = {
            productSupplierRepository: productSupplierRepository()
        }
        return updateProductSupplierHandler(deps)(
            event as IUpdateProductSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateProductSupplierValidator,
    }
)
