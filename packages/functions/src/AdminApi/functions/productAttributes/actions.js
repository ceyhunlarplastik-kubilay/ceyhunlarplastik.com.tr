import { lambdaHandler } from "@/core/middy";
import { productAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository";
import { createProductAttributeHandler, listProductAttributesHandler, getProductAttributeHandler, deleteProductAttributeHandler, updateProductAttributeHandler, listAttributesWithValuesHandler, } from "@/functions/AdminApi/functions/productAttributes/handlers";
import { createProductAttributeValidator, deleteProductAttributeValidator, updateProductAttributeValidator, productAttributeResponseValidator, listProductAttributesResponseValidator, listAttributesWithValuesResponseValidator, } from "@/functions/AdminApi/validators/productAttributes";
export const createProductAttribute = lambdaHandler(async (event) => {
    const deps = {
        productAttributeRepository: productAttributeRepository()
    };
    return createProductAttributeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createProductAttributeValidator,
});
export const listProductAttributes = lambdaHandler(async (event) => {
    const deps = {
        productAttributeRepository: productAttributeRepository()
    };
    return listProductAttributesHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: listProductAttributesResponseValidator,
});
export const listAttributesWithValues = lambdaHandler(async (event) => {
    const deps = {
        productAttributeRepository: productAttributeRepository()
    };
    return listAttributesWithValuesHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: listAttributesWithValuesResponseValidator,
});
export const getProductAttribute = lambdaHandler(async (event) => {
    const deps = {
        productAttributeRepository: productAttributeRepository()
    };
    return getProductAttributeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: productAttributeResponseValidator,
});
export const deleteProductAttribute = lambdaHandler(async (event) => {
    const deps = {
        productAttributeRepository: productAttributeRepository()
    };
    return deleteProductAttributeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: deleteProductAttributeValidator,
});
export const updateProductAttribute = lambdaHandler(async (event) => {
    const deps = {
        productAttributeRepository: productAttributeRepository()
    };
    return updateProductAttributeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: updateProductAttributeValidator,
});
