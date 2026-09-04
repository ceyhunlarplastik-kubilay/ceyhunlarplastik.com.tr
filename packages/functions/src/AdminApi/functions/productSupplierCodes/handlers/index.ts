import { randomUUID } from "crypto"
import createError, { HttpError } from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { generateProductSupplierCodeAssetUpload } from "@/core/helpers/s3/presign"
import { Prisma } from "@/prisma/generated/prisma/client"
import {
    IProductSupplierCodeDependencies,
    ICreateProductSupplierCodeAssetUploadDependencies,
    IListProductSupplierCodesEvent,
    ICreateProductSupplierCodeEvent,
    ICreateProductSupplierCodeAssetUploadEvent,
    IUpdateProductSupplierCodeEvent,
    IDeleteProductSupplierCodeEvent,
} from "@/functions/AdminApi/types/productSupplierCodes"

export const listProductSupplierCodesHandler = (
    { productSupplierCodeRepository }: IProductSupplierCodeDependencies,
) => {
    return async (event: IListProductSupplierCodesEvent) => {
        const codes = await productSupplierCodeRepository.list(event.pathParameters.id)
        return apiResponseDTO({ statusCode: 200, payload: { codes } })
    }
}

/**
 * Ürün modeline tedarikçi harfi tanımlar.
 *
 * `code` verilebilir — "bu üründe Özgen = A" demek için. Verilmezse sıradaki harf
 * atanır. Harf APPEND-ONLY olduğu için mevcut bir kaydın harfi buradan
 * DEĞİŞTİRİLEMEZ: o harfi taşıyan tüm varyant-tedarikçi kodlarını yeniden yazmak
 * gerekirdi.
 */
export const createProductSupplierCodeHandler = (
    { productSupplierCodeRepository }: IProductSupplierCodeDependencies,
) => {
    return async (event: ICreateProductSupplierCodeEvent) => {
        try {
            const code = await productSupplierCodeRepository.create({
                productId: event.pathParameters.id,
                supplierId: event.body.supplierId,
                code: event.body.code,
            })

            return apiResponseDTO({ statusCode: 201, payload: { code } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Tedarikçi harfi oluşturulamadı")
        }
    }
}

/**
 * Harfin hangi tedarikçiye ait olduğunu değiştirir. HARF DEĞİŞMEZ ve hiçbir
 * varyant kodu yeniden yazılmaz — kodda tedarikçi kimliği geçmez, yalnız harf.
 */
export const updateProductSupplierCodeHandler = (
    { productSupplierCodeRepository }: IProductSupplierCodeDependencies,
) => {
    return async (event: IUpdateProductSupplierCodeEvent) => {
        try {
            const code = await productSupplierCodeRepository.update({
                productId: event.pathParameters.id,
                id: event.pathParameters.codeId,
                supplierId: event.body.supplierId,
            })

            return apiResponseDTO({ statusCode: 200, payload: { code } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Tedarikçi harfi güncellenemedi")
        }
    }
}

export const deleteProductSupplierCodeHandler = (
    { productSupplierCodeRepository }: IProductSupplierCodeDependencies,
) => {
    return async (event: IDeleteProductSupplierCodeEvent) => {
        try {
            const result = await productSupplierCodeRepository.remove({
                productId: event.pathParameters.id,
                id: event.pathParameters.codeId,
            })

            return apiResponseDTO({ statusCode: 200, payload: { deletedId: result.id } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Tedarikçi harfi silinemedi")
        }
    }
}

/**
 * Tedarikçi harfi için teknik resim presign'ı — kategori akışının aynısı:
 * PENDING_UPLOAD Asset satırı oluşur, S3 ObjectCreated event'i
 * (confirmProductSupplierCodeAssetUpload) ACTIVE'e çevirir. type & role sabit:
 * TECHNICAL_DRAWING. Harf başına TEK resim — "değiştir" = eskiyi senkron
 * DELETE /assets/{id} + yeniyi bu uçtan yükle (frontend yapar).
 */
export const createProductSupplierCodeAssetUploadHandler = (
    { productSupplierCodeRepository, assetRepository }: ICreateProductSupplierCodeAssetUploadDependencies,
) => {
    return async (event: ICreateProductSupplierCodeAssetUploadEvent) => {
        const productId = event.pathParameters.id
        const codeId = event.pathParameters.codeId
        const { fileName, contentType } = event.body

        if (!fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields")
        }

        // Yetki sınırı: harf gerçekten bu ürün modeline mi ait.
        const code = await productSupplierCodeRepository.findForProduct({ productId, id: codeId })
        if (!code) {
            throw new createError.NotFound("Tedarikçi harfi bulunamadı")
        }

        // assetId key'in dosya adı olur; S3 event'i key'den satırı bulur.
        const assetId = randomUUID()

        const presigned = await generateProductSupplierCodeAssetUpload({
            assetId,
            productId,
            codeId,
            fileName,
            contentType,
        })

        try {
            await assetRepository.createPendingAsset({
                id: assetId,
                key: presigned.key,
                mimeType: contentType,
                type: "TECHNICAL_DRAWING",
                role: "TECHNICAL_DRAWING",
                productSupplierCode: { connect: { id: codeId } },
            })
        } catch (err) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new createError.NotFound("Tedarikçi harfi bulunamadı")
            }
            throw err
        }

        return apiResponseDTO({
            statusCode: 200,
            payload: { ...presigned, assetId }, // { uploadUrl, key, url, assetId }
        })
    }
}
