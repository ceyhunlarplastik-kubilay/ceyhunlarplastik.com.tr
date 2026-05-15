import { lambdaHandler } from "@/core/middy";
import { customerRepository } from "@/core/helpers/prisma/customers/repository";
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository";
import { productRepository } from "@/core/helpers/prisma/products/repository";
import { convertCustomerHandler, createCustomerVisitHandler, deleteCustomerVisitHandler, getCustomerHandler, listCustomerAssignedProductsHandler, listCustomerFeaturedProductsHandler, listCustomersHandler, listCustomerVisitsHandler, replaceCustomerFeaturedProductsHandler, replaceCustomerAssignedProductsHandler, updateCustomerHandler, updateCustomerVisitHandler, } from "@/functions/AdminApi/functions/customers/handlers";
import { createCustomerVisitValidator, customerAssignedProductsResponseValidator, customerFeaturedProductsResponseValidator, customerIdValidator, customerResponseValidator, customerVisitResponseValidator, customerVisitIdValidator, customerVisitsResponseValidator, listCustomersResponseValidator, replaceCustomerAssignedProductsValidator, replaceCustomerFeaturedProductsValidator, updateCustomerValidator, updateCustomerVisitValidator, } from "@/functions/AdminApi/validators/customers";
const deps = {
    customerRepository: customerRepository(),
    productAttributeValueRepository: productAttributeValueRepository(),
    productRepository: productRepository(),
};
export const listCustomers = lambdaHandler(async (event) => listCustomersHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    responseValidator: listCustomersResponseValidator,
});
export const getCustomer = lambdaHandler(async (event) => getCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerResponseValidator,
});
export const updateCustomer = lambdaHandler(async (event) => updateCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: updateCustomerValidator,
    responseValidator: customerResponseValidator,
});
export const convertCustomer = lambdaHandler(async (event) => convertCustomerHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerResponseValidator,
});
export const listCustomerFeaturedProducts = lambdaHandler(async (event) => listCustomerFeaturedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerFeaturedProductsResponseValidator,
});
export const replaceCustomerFeaturedProducts = lambdaHandler(async (event) => replaceCustomerFeaturedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: replaceCustomerFeaturedProductsValidator,
    responseValidator: customerFeaturedProductsResponseValidator,
});
export const listCustomerAssignedProducts = lambdaHandler(async (event) => listCustomerAssignedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerAssignedProductsResponseValidator,
});
export const replaceCustomerAssignedProducts = lambdaHandler(async (event) => replaceCustomerAssignedProductsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: replaceCustomerAssignedProductsValidator,
    responseValidator: customerAssignedProductsResponseValidator,
});
export const listCustomerVisits = lambdaHandler(async (event) => listCustomerVisitsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: customerIdValidator,
    responseValidator: customerVisitsResponseValidator,
});
export const createCustomerVisit = lambdaHandler(async (event) => createCustomerVisitHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: createCustomerVisitValidator,
    responseValidator: customerVisitResponseValidator,
});
export const updateCustomerVisit = lambdaHandler(async (event) => updateCustomerVisitHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: updateCustomerVisitValidator,
    responseValidator: customerVisitResponseValidator,
});
export const deleteCustomerVisit = lambdaHandler(async (event) => deleteCustomerVisitHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["admin", "owner"] },
    requestValidator: customerVisitIdValidator,
    responseValidator: customerVisitResponseValidator,
});
