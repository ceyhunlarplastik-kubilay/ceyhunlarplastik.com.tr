
import { lambdaHandler } from "@/core/middy"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import {
    createSupplierHandler,
    getSupplierHandler,
    listSuppliersHandler,
    deleteSupplierHandler,
    updateSupplierHandler,
} from "@/functions/AdminApi/functions/suppliers/handlers";
import {
    createSupplierValidator,
    getSupplierValidator,
    deleteSupplierValidator,
    updateSupplierValidator,
    supplierResponseValidator,
    listSuppliersResponseValidator,
} from "@/functions/AdminApi/validators/suppliers"
import type {
    ICreateSupplierDependencies,
    ICreateSupplierEvent,
    IGetSupplierDependencies,
    IGetSupplierEvent,
    IListSuppliersDependencies,
    IListSuppliersEvent,
    IDeleteSupplierDependencies,
    IDeleteSupplierEvent,
    IUpdateSupplierDependencies,
    IUpdateSupplierEvent,
} from "@/functions/AdminApi/types/suppliers"

export const createSupplier = lambdaHandler(
    async (event) => {
        const deps: ICreateSupplierDependencies = {
            supplierRepository: supplierRepository()
        }
        return createSupplierHandler(deps)(
            event as ICreateSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createSupplierValidator,
        responseValidator: supplierResponseValidator,
    }
)

export const getSupplier = lambdaHandler(
    async (event) => {
        const deps: IGetSupplierDependencies = {
            supplierRepository: supplierRepository()
        }
        return getSupplierHandler(deps)(
            event as IGetSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: getSupplierValidator,
        responseValidator: supplierResponseValidator,
    }
)

export const listSuppliers = lambdaHandler(
    async (event) => {
        const deps: IListSuppliersDependencies = {
            supplierRepository: supplierRepository()
        }
        return listSuppliersHandler(deps)
            (
                event as IListSuppliersEvent
            )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listSuppliersResponseValidator,
    }
)

export const deleteSupplier = lambdaHandler(
    async (event) => {
        const deps: IDeleteSupplierDependencies = {
            supplierRepository: supplierRepository()
        }
        return deleteSupplierHandler(deps)(
            event as IDeleteSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: deleteSupplierValidator,
        responseValidator: supplierResponseValidator,
    }
)

export const updateSupplier = lambdaHandler(
    async (event) => {
        const deps: IUpdateSupplierDependencies = {
            supplierRepository: supplierRepository()
        }
        return updateSupplierHandler(deps)(
            event as IUpdateSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateSupplierValidator,
        responseValidator: supplierResponseValidator,
    }
)
