import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductSupplierCodeRepository } from "@/core/helpers/prisma/productSupplierCodes/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository"

export interface IProductSupplierCodeDependencies {
    productSupplierCodeRepository: IPrismaProductSupplierCodeRepository
}

export interface ICreateProductSupplierCodeAssetUploadDependencies {
    productSupplierCodeRepository: IPrismaProductSupplierCodeRepository
    assetRepository: IPrismaAssetRepository
}

export type IListProductSupplierCodesEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateProductSupplierCodeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        supplierId: string
        /** Verilmezse sıradaki harf atanır. */
        code?: string
    },
    { id: string }
>

/** Harf (`code`) BİLİNÇLİ olarak alınmaz — değiştirilemez. */
export type IUpdateProductSupplierCodeEvent = IAPIGatewayProxyEventWithUserGeneric<
    { supplierId: string },
    { id: string; codeId: string }
>

export type IDeleteProductSupplierCodeEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; codeId: string }
>

/**
 * Teknik resim presign. type & role handler'da TECHNICAL_DRAWING sabit — istekte
 * gelmez. `id` = ürün modeli, `codeId` = tedarikçi harfi kaydı.
 */
export type ICreateProductSupplierCodeAssetUploadEvent = IAPIGatewayProxyEventWithUserGeneric<
    { fileName: string; contentType: string },
    { id: string; codeId: string }
>
