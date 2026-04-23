import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaAssetRepository } from "@/core/helpers/prisma/assets/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"

export interface IAssetDependencies {
    assetRepository: IPrismaAssetRepository
    productRepository: IPrismaProductRepository
    categoryRepository: IPrismaCategoryRepository
    productVariantRepository: IPrismaProductVariantRepository
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

export interface ICreateAssetBody {
    key?: string
    url?: string
    mimeType?: string
    type: AssetType
    role?: AssetRole
    categoryId?: string
    productId?: string
    variantId?: string
    productAttributeValueId?: string
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
