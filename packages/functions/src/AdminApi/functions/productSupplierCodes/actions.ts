import { lambdaHandler } from "@/core/middy"
import { productSupplierCodeRepository } from "@/core/helpers/prisma/productSupplierCodes/repository"

import {
    listProductSupplierCodesHandler,
    createProductSupplierCodeHandler,
    updateProductSupplierCodeHandler,
    deleteProductSupplierCodeHandler,
} from "@/functions/AdminApi/functions/productSupplierCodes/handlers"
import {
    listProductSupplierCodesValidator,
    createProductSupplierCodeValidator,
    updateProductSupplierCodeValidator,
    deleteProductSupplierCodeValidator,
    listProductSupplierCodesResponseValidator,
    productSupplierCodeResponseValidator,
    deleteProductSupplierCodeResponseValidator,
} from "@/functions/AdminApi/validators/productSupplierCodes"
import type {
    IProductSupplierCodeDependencies,
    IListProductSupplierCodesEvent,
    ICreateProductSupplierCodeEvent,
    IUpdateProductSupplierCodeEvent,
    IDeleteProductSupplierCodeEvent,
} from "@/functions/AdminApi/types/productSupplierCodes"

// Sözlük katalog verisidir; veri girişi operatörü de yönetir (versiyon
// sözlüğüyle aynı sınır).
const supplierCodeManagerGroups = ["admin", "content_editor"]
// Silme sözlükte kalıcı boşluk bırakır — yalnız yönetici.
const supplierCodeAdminGroups = ["admin"]

const getDeps = (): IProductSupplierCodeDependencies => ({
    productSupplierCodeRepository: productSupplierCodeRepository(),
})

export const listProductSupplierCodes = lambdaHandler(
    async (event) => listProductSupplierCodesHandler(getDeps())(event as IListProductSupplierCodesEvent),
    {
        auth: { requiredPermissionGroups: supplierCodeManagerGroups },
        requestValidator: listProductSupplierCodesValidator,
        responseValidator: listProductSupplierCodesResponseValidator,
    }
)

export const createProductSupplierCode = lambdaHandler(
    async (event) => createProductSupplierCodeHandler(getDeps())(event as ICreateProductSupplierCodeEvent),
    {
        auth: { requiredPermissionGroups: supplierCodeManagerGroups },
        requestValidator: createProductSupplierCodeValidator,
        responseValidator: productSupplierCodeResponseValidator,
    }
)

// Harf değişmediği için hiçbir kod yeniden yazılmaz — hatayı yapan operatör
// tedarikçi atamasını düzeltebilmeli.
export const updateProductSupplierCode = lambdaHandler(
    async (event) => updateProductSupplierCodeHandler(getDeps())(event as IUpdateProductSupplierCodeEvent),
    {
        auth: { requiredPermissionGroups: supplierCodeManagerGroups },
        requestValidator: updateProductSupplierCodeValidator,
        responseValidator: productSupplierCodeResponseValidator,
    }
)

export const deleteProductSupplierCode = lambdaHandler(
    async (event) => deleteProductSupplierCodeHandler(getDeps())(event as IDeleteProductSupplierCodeEvent),
    {
        auth: { requiredPermissionGroups: supplierCodeAdminGroups },
        requestValidator: deleteProductSupplierCodeValidator,
        responseValidator: deleteProductSupplierCodeResponseValidator,
    }
)
