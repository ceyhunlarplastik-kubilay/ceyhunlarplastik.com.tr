import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository";
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository";
import { AssetType, AssetRole } from "@/prisma/generated/prisma/client";

export interface IProductDependencies {
    productRepository: IPrismaProductRepository
    categoryRepository: IPrismaCategoryRepository
}

export interface ICreateProductDependencies extends IProductDependencies {
    assetRepository: IPrismaAssetRepository
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

export interface IUpdateProductDependencies extends ICreateProductDependencies { }

export interface IListProductsDependencies { productRepository: IPrismaProductRepository }

export interface ICreateProductBody {
    code: string
    name: string
    description?: string
    categoryId: string
    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
    attributeValueIds?: string[]
}

export type ICreateProductEvent = IAPIGatewayProxyEventWithUserGeneric<ICreateProductBody>

export type IUpdateProductEvent = IAPIGatewayProxyEventWithUserGeneric<Partial<ICreateProductBody>, { id: string }>

export type IGetProductEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IGetProductBySlugEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { slug: string }>

export type IDeleteProductEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListProductsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        categoryId?: string
    }
>




export interface ICreateProductAssetUploadBody {
    productSlug: string
    assetRole: string
    fileName: string
    contentType: string
}

export type ICreateProductAssetUploadEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductAssetUploadBody>
