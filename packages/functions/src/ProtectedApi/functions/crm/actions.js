import { lambdaHandler } from "@/core/middy";
import { customerRepository } from "@/core/helpers/prisma/customers/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository";
import { productRepository } from "@/core/helpers/prisma/products/repository";
import { createManagedCustomerVisitHandler, convertManagedCustomerHandler, deleteManagedCustomerVisitHandler, getManagedCustomerHandler, getManagedSupplierHandler, getPortalCustomerAssignedProductsHandler, getPortalCustomerFeaturedProductsHandler, getPortalCustomerHandler, listManagedCustomerAssignedProductsHandler, listManagedCustomerFeaturedProductsHandler, listManagedCustomersHandler, listManagedCustomerVisitsHandler, listManagedSuppliersHandler, replaceManagedCustomerAssignedProductsHandler, replaceManagedCustomerFeaturedProductsHandler, updateManagedCustomerHandler, updateManagedCustomerVisitHandler, } from "@/functions/ProtectedApi/functions/crm/handlers";
import { createCustomerVisitValidator, customerAssignedProductsResponseValidator, customerFeaturedProductsResponseValidator, customerIdValidator, customerResponseValidator, customerVisitIdValidator, customerVisitResponseValidator, customerVisitsResponseValidator, listCustomersResponseValidator, replaceCustomerAssignedProductsValidator, replaceCustomerFeaturedProductsValidator, updateCustomerValidator, updateCustomerVisitValidator, } from "@/functions/AdminApi/validators/customers";
import { getSupplierValidator, listSuppliersResponseValidator, supplierResponseValidator, } from "@/functions/AdminApi/validators/suppliers";
const deps = {
    customerRepository: customerRepository(),
    supplierRepository: supplierRepository(),
    productAttributeValueRepository: productAttributeValueRepository(),
    productRepository: productRepository(),
};
export const listManagedCustomers = lambdaHandler(async (event) => listManagedCustomersHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    responseValidator: listCustomersResponseValidator,
});
export const getManagedCustomer = lambdaHandler(async (event) => getManagedCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerResponseValidator,
});
export const updateManagedCustomer = lambdaHandler(async (event) => updateManagedCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: updateCustomerValidator,
    responseValidator: customerResponseValidator,
});
export const convertManagedCustomer = lambdaHandler(async (event) => convertManagedCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerResponseValidator,
});
export const listManagedCustomerFeaturedProducts = lambdaHandler(async (event) => listManagedCustomerFeaturedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerFeaturedProductsResponseValidator,
});
export const replaceManagedCustomerFeaturedProducts = lambdaHandler(async (event) => replaceManagedCustomerFeaturedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: replaceCustomerFeaturedProductsValidator,
    responseValidator: customerFeaturedProductsResponseValidator,
});
export const listManagedCustomerAssignedProducts = lambdaHandler(async (event) => listManagedCustomerAssignedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerAssignedProductsResponseValidator,
});
export const replaceManagedCustomerAssignedProducts = lambdaHandler(async (event) => replaceManagedCustomerAssignedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: replaceCustomerAssignedProductsValidator,
    responseValidator: customerAssignedProductsResponseValidator,
});
export const listManagedCustomerVisits = lambdaHandler(async (event) => listManagedCustomerVisitsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerVisitsResponseValidator,
});
export const createManagedCustomerVisit = lambdaHandler(async (event) => createManagedCustomerVisitHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: createCustomerVisitValidator,
    responseValidator: customerVisitResponseValidator,
});
export const updateManagedCustomerVisit = lambdaHandler(async (event) => updateManagedCustomerVisitHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: updateCustomerVisitValidator,
    responseValidator: customerVisitResponseValidator,
});
export const deleteManagedCustomerVisit = lambdaHandler(async (event) => deleteManagedCustomerVisitHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: customerVisitIdValidator,
    responseValidator: customerVisitResponseValidator,
});
export const listManagedSuppliers = lambdaHandler(async (event) => listManagedSuppliersHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["purchasing", "admin", "owner"] },
    responseValidator: listSuppliersResponseValidator,
});
export const getManagedSupplier = lambdaHandler(async (event) => getManagedSupplierHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["purchasing", "admin", "owner"] },
    requestValidator: getSupplierValidator,
    responseValidator: supplierResponseValidator,
});
export const getPortalCustomer = lambdaHandler(async (event) => getPortalCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
    responseValidator: customerResponseValidator,
});
export const getPortalCustomerFeaturedProducts = lambdaHandler(async (event) => getPortalCustomerFeaturedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
    responseValidator: customerFeaturedProductsResponseValidator,
});
export const getPortalCustomerAssignedProducts = lambdaHandler(async (event) => getPortalCustomerAssignedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
    responseValidator: customerAssignedProductsResponseValidator,
});
