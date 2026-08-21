import { lambdaHandler } from "@/core/middy"
import { productVariantMatrixRepository } from "@/core/helpers/prisma/productVariantMatrix/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { colorRepository } from "@/core/helpers/prisma/colors/repository"
import { materialRepository } from "@/core/helpers/prisma/materials/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

import {
    getProductVariantMatrixHandler,
    getVariantMatrixReferencesHandler,
    saveProductVariantMatrixHandler,
    setVariantCodeLockHandler,
    renumberVariantCodesHandler,
    updateVariantMatrixSupplierHandler,
    deleteVariantMatrixSupplierHandler,
    deleteVariantMatrixVariantHandler,
} from "@/functions/AdminApi/functions/productVariantMatrix/handlers"
import {
    idValidator,
    saveVariantMatrixValidator,
    setVariantCodeLockValidator,
    renumberVariantCodesValidator,
    variantMatrixResponseValidator,
    variantMatrixReferencesResponseValidator,
    saveVariantMatrixResponseValidator,
    variantCodeLockResponseValidator,
    renumberVariantCodesResponseValidator,
    updateVariantMatrixSupplierValidator,
    variantMatrixSupplierRowValidator,
    variantMatrixVariantValidator,
    updateVariantMatrixSupplierResponseValidator,
    deleteVariantMatrixRowResponseValidator,
} from "@/functions/AdminApi/validators/productVariantMatrix"
import type {
    IProductVariantMatrixDependencies,
    IVariantMatrixReferenceDependencies,
    IGetVariantMatrixEvent,
    ISaveVariantMatrixEvent,
    ISetVariantCodeLockEvent,
    IRenumberVariantCodesEvent,
    IUpdateVariantMatrixSupplierEvent,
    IDeleteVariantMatrixSupplierEvent,
    IDeleteVariantMatrixVariantEvent,
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

const getReferenceDeps = (): IVariantMatrixReferenceDependencies => ({
    colorRepository: colorRepository(),
    materialRepository: materialRepository(),
    supplierRepository: supplierRepository(),
    measurementTypeRepository: measurementTypeRepository(),
})

export const getVariantMatrixReferences = lambdaHandler(
    async () => getVariantMatrixReferencesHandler(getReferenceDeps())(),
    {
        auth: { requiredPermissionGroups: variantMatrixManagerGroups },
        responseValidator: variantMatrixReferencesResponseValidator,
    }
)

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

export const updateVariantMatrixSupplier = lambdaHandler(
    async (event) => updateVariantMatrixSupplierHandler(getDeps())(event as IUpdateVariantMatrixSupplierEvent),
    {
        auth: { requiredPermissionGroups: variantMatrixManagerGroups },
        requestValidator: updateVariantMatrixSupplierValidator,
        responseValidator: updateVariantMatrixSupplierResponseValidator,
    }
)

export const deleteVariantMatrixSupplier = lambdaHandler(
    async (event) => deleteVariantMatrixSupplierHandler(getDeps())(event as IDeleteVariantMatrixSupplierEvent),
    {
        auth: { requiredPermissionGroups: variantMatrixManagerGroups },
        requestValidator: variantMatrixSupplierRowValidator,
        responseValidator: deleteVariantMatrixRowResponseValidator,
    }
)

export const deleteVariantMatrixVariant = lambdaHandler(
    async (event) => deleteVariantMatrixVariantHandler(getDeps())(event as IDeleteVariantMatrixVariantEvent),
    {
        auth: { requiredPermissionGroups: variantMatrixManagerGroups },
        requestValidator: variantMatrixVariantValidator,
        responseValidator: deleteVariantMatrixRowResponseValidator,
    }
)
