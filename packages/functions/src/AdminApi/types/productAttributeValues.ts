import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { IPrismaProductAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository"
import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"

export interface IProductAttributeValueDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    productAttributeRepository: IPrismaProductAttributeRepository
    assetRepository: IPrismaAssetRepository
}

export interface ICreateProductAttributeValueBody {
    name: string
    attributeId: string
    displayOrder?: number
    parentValueId?: string | null
    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
}

export interface ICreateProductAttributeValueAssetUploadBody {
    productAttributeValueId: string
    assetRole: string
    fileName: string
    contentType: string
}

export type ICreateProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAttributeValueBody>

export type IListProductAttributeValuesEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { attributeId: string }>

export type IUpdateProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateProductAttributeValueBody>,
        { id: string }
    >

export type IDeleteProductAttributeValueEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateProductAttributeValueAssetUploadEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAttributeValueAssetUploadBody>
