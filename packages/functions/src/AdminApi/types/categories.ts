import { IAPIGatewayProxyEventWithUser, IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository";
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository";
import { AssetType, AssetRole } from "@/prisma/generated/prisma/client";
import type { CategoryTranslationInput } from "@/core/helpers/categories/categoryTranslations"
import type { TargetLocale } from "@/core/i18n/locales"

export interface ICreateCategoryBody {
    code: number
    name: string
    translations?: CategoryTranslationInput[]
    allowedAttributeValueIds?: string[]
}

export type RemovableCategoryTranslationLocale = TargetLocale

export type ICreateCategoryEvent = IAPIGatewayProxyEventWithUser<ICreateCategoryBody>

export interface IListCategoriesQueryParams {
    page?: string
    limit?: string
    search?: string
    sort?: "code" | "name" | "createdAt"
    order?: "asc" | "desc"
    locale?: string
}

export type IListCategoriesEvent =
    IAPIGatewayProxyEventWithUser & {
        queryStringParameters?: IListCategoriesQueryParams
    }

export type IGetCategoryEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }, { locale?: string }>

export type IGetCategoryBySlugEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { slug: string }, { locale?: string }>

export type IDeleteCategoryEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IUpdateCategoryEvent =
    IAPIGatewayProxyEventWithUser & {
        pathParameters?: {
            id: string
        }
        body: Partial<{
            code: string
            name: string
            translations?: CategoryTranslationInput[]
            removeTranslationLocales?: RemovableCategoryTranslationLocale[]
            allowedAttributeValueIds?: string[]
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
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

// export interface IDeleteCategoryDependencies extends IGetCategoryDependencies { }

export interface IDeleteCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository,
    assetRepository: IPrismaAssetRepository,
}

// export interface IUpdateCategoryDependencies extends IGetCategoryDependencies { }

export interface IUpdateCategoryDependencies {
    categoryRepository: IPrismaCategoryRepository,
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

// Presign: var olan kategori için anahtar + PENDING_UPLOAD Asset satırı birlikte üretilir.
export interface ICreateCategoryAssetUploadBody {
    categoryId: string
    assetRole: AssetRole
    assetType: AssetType
    fileName: string
    contentType: string
}

export type ICreateCategoryAssetUploadEvent = IAPIGatewayProxyEventWithUserGeneric<Partial<ICreateCategoryAssetUploadBody>, {}>

export interface ICreateCategoryAssetUploadDependencies {
    categoryRepository: IPrismaCategoryRepository
    assetRepository: IPrismaAssetRepository
}
