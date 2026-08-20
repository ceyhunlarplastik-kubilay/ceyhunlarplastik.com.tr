import { lambdaHandler } from "@/core/middy"
import { productVariantMatrixRepository } from "@/core/helpers/prisma/productVariantMatrix/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"

import {
    getProductVariantMatrixHandler,
    saveProductVariantMatrixHandler,
    setVariantCodeLockHandler,
    renumberVariantCodesHandler,
} from "@/functions/AdminApi/functions/productVariantMatrix/handlers"
import {
    idValidator,
    saveVariantMatrixValidator,
    setVariantCodeLockValidator,
    renumberVariantCodesValidator,
    variantMatrixResponseValidator,
    saveVariantMatrixResponseValidator,
    variantCodeLockResponseValidator,
    renumberVariantCodesResponseValidator,
} from "@/functions/AdminApi/validators/productVariantMatrix"
import type {
    IProductVariantMatrixDependencies,
    IGetVariantMatrixEvent,
    ISaveVariantMatrixEvent,
    ISetVariantCodeLockEvent,
    IRenumberVariantCodesEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

// Veri girişi operatörü matrisi okur ve yazar; marj alanları handler seviyesinde
// ayrıca filtrelenir (bkz. supplierFieldVisibility.ts).
const variantMatrixManagerGroups = ["admin", "content_editor"]

// Kilit ve yeniden numaralandırma kod düzenini kalıcı olarak etkiler — operatöre kapalı.
const variantCodeAdminGroups = ["admin"]

const getDeps = (): IProductVariantMatrixDependencies => ({
    productVariantMatrixRepository: productVariantMatrixRepository(),
    productRepository: productRepository(),
})

export const getProductVariantMatrix = lambdaHandler(
    async (event) => getProductVariantMatrixHandler(getDeps())(event as IGetVariantMatrixEvent),
    {
        auth: { requiredPermissionGroups: variantMatrixManagerGroups },
        requestValidator: idValidator,
        responseValidator: variantMatrixResponseValidator,
    }
)

export const saveProductVariantMatrix = lambdaHandler(
    async (event) => saveProductVariantMatrixHandler(getDeps())(event as ISaveVariantMatrixEvent),
    {
        auth: { requiredPermissionGroups: variantMatrixManagerGroups },
        requestValidator: saveVariantMatrixValidator,
        responseValidator: saveVariantMatrixResponseValidator,
    }
)

export const setVariantCodeLock = lambdaHandler(
    async (event) => setVariantCodeLockHandler(getDeps())(event as ISetVariantCodeLockEvent),
    {
        auth: { requiredPermissionGroups: variantCodeAdminGroups },
        requestValidator: setVariantCodeLockValidator,
        responseValidator: variantCodeLockResponseValidator,
    }
)

export const renumberVariantCodes = lambdaHandler(
    async (event) => renumberVariantCodesHandler(getDeps())(event as IRenumberVariantCodesEvent),
    {
        auth: { requiredPermissionGroups: variantCodeAdminGroups },
        requestValidator: renumberVariantCodesValidator,
        responseValidator: renumberVariantCodesResponseValidator,
    }
)
