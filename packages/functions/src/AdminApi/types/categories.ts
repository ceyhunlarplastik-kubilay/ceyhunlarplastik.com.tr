import { IAPIGatewayProxyEventWithUser, IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository";
import { AssetType, AssetRole } from "@/prisma/generated/prisma/client";

export interface ICreateCategoryBody {
    code: number
    name: string
    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
}

export type ICreateCategoryEvent = IAPIGatewayProxyEventWithUser<ICreateCategoryBody>

export interface IListCategoriesQueryParams {
    page?: string
    limit?: string
    search?: string
    sort?: "code" | "name" | "createdAt"
    order?: "asc" | "desc"
}

export type IListCategoriesEvent =
    IAPIGatewayProxyEventWithUser & {
        queryStringParameters?: IListCategoriesQueryParams
    }

export type IGetCategoryEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IGetCategoryBySlugEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { slug: string }>

export type IDeleteCategoryEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IUpdateCategoryEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
        body: Partial<{
            code: string
            name: string
            assetKey?: string
            assetRole?: AssetRole
            mimeType?: string
            assetType?: AssetType
        }>
    }


export interface IGetCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository,
}

// export interface IListCategoriesDependencies extends IGetCategoryDependencies { }

export interface IListCategoriesDependencies {
    categoryRepository: IPrismaCategoryRepository,
}

export interface ICreateCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository
    assetRepository: IPrismaAssetRepository
}

// export interface IDeleteCategoryDependencies extends IGetCategoryDependencies { }

export interface IDeleteCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository,
}

// export interface IUpdateCategoryDependencies extends IGetCategoryDependencies { }

export interface IUpdateCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository,
    assetRepository: IPrismaAssetRepository,
}

// ✅ Presign request
export interface ICreateCategoryAssetUploadBody {
    categorySlug: string
    assetRole: AssetRole
    fileName: string
    contentType: string
}

export type ICreateCategoryAssetUploadEvent = IAPIGatewayProxyEventWithUserGeneric<Partial<ICreateCategoryAssetUploadBody>, {}>