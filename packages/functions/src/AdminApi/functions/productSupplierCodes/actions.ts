import { lambdaHandler } from "@/core/middy"
import { productSupplierCodeRepository } from "@/core/helpers/prisma/productSupplierCodes/repository"
import { assetRepository } from "@/core/helpers/prisma/assets/repository"

import {
    listProductSupplierCodesHandler,
    createProductSupplierCodeHandler,
    createProductSupplierCodeAssetUploadHandler,
    updateProductSupplierCodeHandler,
    deleteProductSupplierCodeHandler,
} from "@/functions/AdminApi/functions/productSupplierCodes/handlers"
import {
    listProductSupplierCodesValidator,
    createProductSupplierCodeValidator,
    createProductSupplierCodeAssetUploadValidator,
    updateProductSupplierCodeValidator,
    deleteProductSupplierCodeValidator,
    listProductSupplierCodesResponseValidator,
    productSupplierCodeResponseValidator,
    productSupplierCodeAssetUploadResponseValidator,
    deleteProductSupplierCodeResponseValidator,
} from "@/functions/AdminApi/validators/productSupplierCodes"
import type {
    IProductSupplierCodeDependencies,
    ICreateProductSupplierCodeAssetUploadDependencies,
    IListProductSupplierCodesEvent,
    ICreateProductSupplierCodeEvent,
    ICreateProductSupplierCodeAssetUploadEvent,
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

const getAssetUploadDeps = (): ICreateProductSupplierCodeAssetUploadDependencies => ({
    productSupplierCodeRepository: productSupplierCodeRepository(),
    assetRepository: assetRepository(),
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

// Teknik resim presign'ı: PENDING_UPLOAD Asset satırı oluşur, S3 event'i ACTIVE
// yapar. Sözlük yönetiminin sınırı — admin + content_editor.
export const createProductSupplierCodeAssetUpload = lambdaHandler(
    async (event) => createProductSupplierCodeAssetUploadHandler(getAssetUploadDeps())(event as ICreateProductSupplierCodeAssetUploadEvent),
    {
        auth: { requiredPermissionGroups: supplierCodeManagerGroups },
        requestValidator: createProductSupplierCodeAssetUploadValidator,
        responseValidator: productSupplierCodeAssetUploadResponseValidator,
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
