import { lambdaHandler } from "@/core/middy";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { getSupplierHandler, listSuppliersHandler } from "@/functions/PublicApi/functions/suppliers/handlers";
import { idValidator, supplierResponseValidator, listSuppliersResponseValidator, } from "@/functions/PublicApi/validators/suppliers";
export const getSupplier = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return getSupplierHandler(deps)(event);
}, {
    auth: false,
    requestValidator: idValidator,
    responseValidator: supplierResponseValidator,
});
export const listSuppliers = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return listSuppliersHandler(deps)(event);
}, {
    auth: false,
    responseValidator: listSuppliersResponseValidator,
});
