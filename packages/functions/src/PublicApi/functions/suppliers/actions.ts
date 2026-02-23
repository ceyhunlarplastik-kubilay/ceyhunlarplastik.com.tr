
import { lambdaHandler } from "@/core/middy"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { getSupplierHandler, listSuppliersHandler } from "@/functions/PublicApi/functions/suppliers/handlers";
import {
    idValidator,
    supplierResponseValidator,
    listSuppliersResponseValidator,
} from "@/functions/PublicApi/validators/suppliers"
import type {
    ISupplierDependencies,
    IGetSupplierEvent,
    IListSuppliersEvent,
} from "@/functions/PublicApi/types/suppliers"

export const getSupplier = lambdaHandler(
    async (event) => {
        const deps: ISupplierDependencies = {
            supplierRepository: supplierRepository()
        }
        return getSupplierHandler(deps)(
            event as IGetSupplierEvent
        )
    },
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: supplierResponseValidator,
    }
)

export const listSuppliers = lambdaHandler(
    async (event) => {
        const deps: ISupplierDependencies = {
            supplierRepository: supplierRepository()
        }
        return listSuppliersHandler(deps)
            (
                event as IListSuppliersEvent
            )
    },
    {
        auth: false,
        responseValidator: listSuppliersResponseValidator,
    }
)
