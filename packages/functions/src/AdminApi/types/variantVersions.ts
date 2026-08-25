import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaVariantVersionRepository } from "@/core/helpers/prisma/variantVersions/repository"

export interface IVariantVersionDependencies {
    variantVersionRepository: IPrismaVariantVersionRepository
}

export type IListVariantVersionsEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateVariantVersionEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        colorId?: string
        materialIds?: string[]
        /** Verilmezse ürün içindeki sıradaki boş numara atanır. */
        code?: number
    },
    { id: string }
>

/** Kombinasyon düzenleme. Kod (`code`) BİLİNÇLİ olarak alınmaz — değiştirilemez. */
export type IUpdateVariantVersionEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        colorId?: string
        materialIds?: string[]
    },
    { id: string; versionId: string }
>

export type IDeleteVariantVersionEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; versionId: string }
>
