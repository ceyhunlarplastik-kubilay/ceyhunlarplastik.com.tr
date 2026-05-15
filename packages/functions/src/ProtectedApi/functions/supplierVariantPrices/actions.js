import { lambdaHandler } from "@/core/middy";
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { listSupplierVariantPricesHandler, listSupplierProductsHandler, getSupplierProfileHandler, updateSupplierProfileHandler, updateSupplierVariantPriceHandler, } from "@/functions/ProtectedApi/functions/supplierVariantPrices/handlers";
import { listSupplierProductsResponseValidator, supplierProfileResponseValidator, listSupplierVariantPricesResponseValidator, supplierVariantPriceResponseValidator, updateSupplierProfileValidator, updateSupplierVariantPriceValidator, } from "@/functions/ProtectedApi/validators/supplierVariantPrices";
const getDeps = () => ({
    productVariantSupplierRepository: productVariantSupplierRepository(),
    supplierRepository: supplierRepository(),
});
export const listSupplierVariantPrices = lambdaHandler(async (event) => {
    return listSupplierVariantPricesHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["supplier", "purchasing", "sales", "sales_director", "admin", "owner"] },
    // auth: false,
    responseValidator: listSupplierVariantPricesResponseValidator,
});
export const updateSupplierVariantPrice = lambdaHandler(async (event) => {
    return updateSupplierVariantPriceHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["supplier", "purchasing", "admin", "owner"] },
    /* auth: false, */
    requestValidator: updateSupplierVariantPriceValidator,
    responseValidator: supplierVariantPriceResponseValidator,
});
export const listSupplierProducts = lambdaHandler(async (event) => {
    return listSupplierProductsHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["supplier", "purchasing", "sales", "sales_director", "admin", "owner"] },
    responseValidator: listSupplierProductsResponseValidator,
});
export const getSupplierProfile = lambdaHandler(async (event) => {
    return getSupplierProfileHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["supplier", "purchasing", "sales", "sales_director", "admin", "owner"] },
    responseValidator: supplierProfileResponseValidator,
});
export const updateSupplierProfile = lambdaHandler(async (event) => {
    return updateSupplierProfileHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["supplier", "admin", "owner"] },
    requestValidator: updateSupplierProfileValidator,
    responseValidator: supplierProfileResponseValidator,
});
