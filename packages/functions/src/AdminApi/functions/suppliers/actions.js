import { lambdaHandler } from "@/core/middy";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { createSupplierHandler, getSupplierHandler, listSuppliersHandler, deleteSupplierHandler, updateSupplierHandler, } from "@/functions/AdminApi/functions/suppliers/handlers";
import { createSupplierValidator, getSupplierValidator, deleteSupplierValidator, updateSupplierValidator, supplierResponseValidator, listSuppliersResponseValidator, } from "@/functions/AdminApi/validators/suppliers";
export const createSupplier = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return createSupplierHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: createSupplierValidator,
    responseValidator: supplierResponseValidator,
});
export const getSupplier = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return getSupplierHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: getSupplierValidator,
    responseValidator: supplierResponseValidator,
});
export const listSuppliers = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return listSuppliersHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    responseValidator: listSuppliersResponseValidator,
});
export const deleteSupplier = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return deleteSupplierHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: deleteSupplierValidator,
    responseValidator: supplierResponseValidator,
});
export const updateSupplier = lambdaHandler(async (event) => {
    const deps = {
        supplierRepository: supplierRepository()
    };
    return updateSupplierHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: updateSupplierValidator,
    responseValidator: supplierResponseValidator,
});
