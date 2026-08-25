import createError, { HttpError } from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IVariantVersionDependencies,
    IListVariantVersionsEvent,
    ICreateVariantVersionEvent,
    IUpdateVariantVersionEvent,
    IDeleteVariantVersionEvent,
} from "@/functions/AdminApi/types/variantVersions"

export const listVariantVersionsHandler = ({ variantVersionRepository }: IVariantVersionDependencies) => {
    return async (event: IListVariantVersionsEvent) => {
        const versions = await variantVersionRepository.list(event.pathParameters.id)
        return apiResponseDTO({
            statusCode: 200,
            payload: {
                versions,
                nextCode: (versions.at(-1)?.code ?? 0) + 1,
            },
        })
    }
}

/**
 * Ürün modelinin sözlüğüne yeni kombinasyon ekler.
 *
 * `code` verilebilir — veri girişine başlamadan "Siyah + Bakalit = V1" demek için.
 * Verilmezse ürün içindeki sıradaki boş numara atanır. Numara APPEND-ONLY olduğu
 * için mevcut bir kaydın kodu buradan DEĞİŞTİRİLEMEZ: o kombinasyonu kullanan tüm
 * varyantların kodunu yeniden yazmak gerekirdi.
 */
export const createVariantVersionHandler = ({ variantVersionRepository }: IVariantVersionDependencies) => {
    return async (event: ICreateVariantVersionEvent) => {
        const { colorId, materialIds, code } = event.body

        if (!colorId && (!materialIds || materialIds.length === 0)) {
            throw new createError.BadRequest("En az bir renk veya hammadde seçilmeli")
        }

        try {
            const version = await variantVersionRepository.create({
                productId: event.pathParameters.id,
                colorId: colorId ?? null,
                materialIds: materialIds ?? [],
                code,
            })

            return apiResponseDTO({ statusCode: 201, payload: { version } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Versiyon oluşturulamadı")
        }
    }
}

export const deleteVariantVersionHandler = ({ variantVersionRepository }: IVariantVersionDependencies) => {
    return async (event: IDeleteVariantVersionEvent) => {
        try {
            const result = await variantVersionRepository.remove({
                productId: event.pathParameters.id,
                id: event.pathParameters.versionId,
            })
            return apiResponseDTO({ statusCode: 200, payload: { deletedId: result.id } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Versiyon silinemedi")
        }
    }
}

/**
 * Versiyonun renk + hammadde kombinasyonunu değiştirir.
 *
 * Kod DEĞİŞMEZ ve hiçbir varyant kodu yeniden yazılmaz — `fullCode` (10.5.8.V1)
 * içinde renk/hammadde geçmez, yalnız versiyon NUMARASI geçer. Bu yüzden veri
 * girişinde yapılmış bir seçim hatası (ör. fazladan hammadde) varyantları
 * silmeden düzeltilebilir.
 *
 * Kalan risk anlamsaldır: dışarı çıkmış bir katalogda V1 artık başka bir
 * kombinasyonu gösterir. Arayüz, kullanımdaki bir versiyon düzenlenirken kaç
 * varyantı etkilediğini söyleyip onay ister.
 */
export const updateVariantVersionHandler = ({ variantVersionRepository }: IVariantVersionDependencies) => {
    return async (event: IUpdateVariantVersionEvent) => {
        const { colorId, materialIds } = event.body

        if (!colorId && (!materialIds || materialIds.length === 0)) {
            throw new createError.BadRequest("En az bir renk veya hammadde seçilmeli")
        }

        try {
            const version = await variantVersionRepository.update({
                productId: event.pathParameters.id,
                id: event.pathParameters.versionId,
                colorId: colorId ?? null,
                materialIds: materialIds ?? [],
            })

            return apiResponseDTO({ statusCode: 200, payload: { version } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Versiyon güncellenemedi")
        }
    }
}
