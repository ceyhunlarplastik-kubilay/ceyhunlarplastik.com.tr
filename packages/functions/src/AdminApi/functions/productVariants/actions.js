import { lambdaHandler } from "@/core/middy";
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository";
import { productRepository } from "@/core/helpers/prisma/products/repository";
import { materialRepository } from "@/core/helpers/prisma/materials/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository";
import { colorRepository } from "@/core/helpers/prisma/colors/repository";
import { createProductVariantHandler, getProductVariantHandler, listProductVariantsHandler, deleteProductVariantHandler, updateProductVariantHandler, getProductVariantReferencesHandler, getProductVariantTableHandler, } from "@/functions/AdminApi/functions/productVariants/handlers";
import { createProductVariantValidator, updateProductVariantValidator, idValidator, productVariantResponseValidator, listProductVariantResponseValidator, } from "@/functions/AdminApi/validators/productVariants";
const getDeps = () => ({
    productVariantRepository: productVariantRepository(),
    productRepository: productRepository(),
    materialRepository: materialRepository(),
    supplierRepository: supplierRepository(),
    measurementTypeRepository: measurementTypeRepository(),
    colorRepository: colorRepository(),
});
export const createProductVariant = lambdaHandler(async (event) => {
    return createProductVariantHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createProductVariantValidator,
    responseValidator: productVariantResponseValidator,
});
export const getProductVariant = lambdaHandler(async (event) => {
    return getProductVariantHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: idValidator,
    responseValidator: productVariantResponseValidator,
});
export const listProductVariants = lambdaHandler(async (event) => {
    return listProductVariantsHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: listProductVariantResponseValidator,
});
export const deleteProductVariant = lambdaHandler(async (event) => {
    return deleteProductVariantHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: idValidator,
    responseValidator: productVariantResponseValidator,
});
export const updateProductVariant = lambdaHandler(async (event) => {
    return updateProductVariantHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: updateProductVariantValidator,
    responseValidator: productVariantResponseValidator,
});
export const getProductVariantReferences = lambdaHandler(async () => {
    return getProductVariantReferencesHandler(getDeps())();
}, {
    auth: { requiredPermissionGroups: ["admin"] },
});
export const getProductVariantTable = lambdaHandler(async (event) => {
    return getProductVariantTableHandler(getDeps())(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
});
