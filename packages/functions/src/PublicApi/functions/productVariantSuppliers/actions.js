import { lambdaHandler } from "@/core/middy";
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository";
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { getProductVariantSupplierHandler, listProductVariantSuppliersHandler } from "@/functions/PublicApi/functions/productVariantSuppliers/handlers";
import { idValidator } from "@/functions/PublicApi/validators/productVariantSuppliers";
const getDeps = () => ({
    productVariantSupplierRepository: productVariantSupplierRepository(),
    productVariantRepository: productVariantRepository(),
    supplierRepository: supplierRepository(),
});
export const getProductVariantSupplier = lambdaHandler(async (event) => {
    return getProductVariantSupplierHandler(getDeps())(event);
}, {
    auth: false,
    requestValidator: idValidator,
});
export const listProductVariantSuppliers = lambdaHandler(async (event) => {
    return listProductVariantSuppliersHandler(getDeps())(event);
}, {
    auth: false,
});
