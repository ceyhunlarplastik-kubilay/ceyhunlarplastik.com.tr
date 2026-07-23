import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository"
import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"
import type { VariantDictionaryTranslationInput } from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

export interface IMaterialDependencies {
    materialRepository: IPrismaMaterialRepository
    assetRepository: IPrismaAssetRepository
}

export interface ICreateMaterialBody {
    name: string
    code?: string
    translations?: VariantDictionaryTranslationInput[]
}

export interface IUpdateMaterialBody extends Partial<ICreateMaterialBody> {
    assetKey?: string
    assetRole?: AssetRole
    assetType?: AssetType
    mimeType?: string
}

export interface ICreateMaterialAssetUploadBody {
    fileName: string
    contentType: string
    assetRole?: AssetRole
}

export type ICreateMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateMaterialBody>

export type IUpdateMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IUpdateMaterialBody,
        { id: string }
    >

export type IGetMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateMaterialAssetUploadEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        ICreateMaterialAssetUploadBody,
        { id: string }
    >

export type IDeleteMaterialEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListMaterialsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            certificateOnly?: "true" | "false"
        }
    >
