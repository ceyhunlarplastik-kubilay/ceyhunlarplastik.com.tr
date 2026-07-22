import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { IPrismaProductAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository"
import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"
import type { ProductAttributeValueTranslationInput } from "@/core/helpers/productAttributes/productAttributeTranslations"

export interface IProductAttributeValueDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    productAttributeRepository: IPrismaProductAttributeRepository
    assetRepository: IPrismaAssetRepository
}

export interface ICreateProductAttributeValueBody {
    name: string
    translations?: ProductAttributeValueTranslationInput[]
    attributeId: string
    displayOrder?: number
    parentValueId?: string | null
    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
}

export type RemovableProductAttributeValueTranslationLocale = "en"

export interface ICreateProductAttributeValueAssetUploadBody {
    productAttributeValueId: string
    assetRole: string
    fileName: string
    contentType: string
}

export type ICreateProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAttributeValueBody>

// attributeId iki yoldan gelebilir: /{id} path parametresi veya ?attributeId= query string.
export type IListProductAttributeValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        { attributeId?: string; id?: string } | undefined,
        { attributeId?: string; locale?: string } | undefined
    >

export type IUpdateProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductAttributeValueBody> & {
            removeTranslationLocales?: RemovableProductAttributeValueTranslationLocale[]
        },
        { id: string }
    >

export type IDeleteProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateProductAttributeValueAssetUploadEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAttributeValueAssetUploadBody>
