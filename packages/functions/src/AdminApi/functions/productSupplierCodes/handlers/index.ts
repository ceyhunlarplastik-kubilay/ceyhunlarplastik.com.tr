import createError, { HttpError } from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductSupplierCodeDependencies,
    IListProductSupplierCodesEvent,
    ICreateProductSupplierCodeEvent,
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
