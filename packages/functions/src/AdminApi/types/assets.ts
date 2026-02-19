import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { AssetType } from "@/prisma/generated/prisma/client"

export interface IAssetDependencies {
    assetRepository: IPrismaAssetRepository
    productRepository: IPrismaProductRepository
    categoryRepository: IPrismaCategoryRepository
    productVariantRepository: IPrismaProductVariantRepository
}

export interface ICreateAssetBody {
    url: string
    type: AssetType
    categoryId?: string
    productId?: string
    variantId?: string
}

export type ICreateAssetEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateAssetBody>

export type IUpdateAssetEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        Partial<ICreateAssetBody>,
        { id: string }
    >

export type IGetAssetEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteAssetEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListAssetsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
        }
    >
