import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"

export interface IProductVariantDependencies {
    productVariantRepository: IPrismaProductVariantRepository
    productRepository: IPrismaProductRepository
    materialRepository: IPrismaMaterialRepository
    supplierRepository: IPrismaSupplierRepository
    measurementTypeRepository: IPrismaMeasurementTypeRepository
    colorRepository: IPrismaColorRepository
}

export interface IVariantSupplierInput {
    supplierId: string
    isActive?: boolean
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
    paymentTermDays?: number
    supplierVariantCode?: string
    supplierNote?: string
    minOrderQty?: number
    stockQty?: number
    currency?: string
    hasSupplierLogo?: boolean
    unitsPerPackage?: number
    packageLengthMm?: number
    packageWidthMm?: number
    packageHeightMm?: number
    packageWeightKg?: number
    minLeadTimeDays?: number
}

/**
 * Kod alanları (`versionCode`/`supplierCode`/`variantIndex`) BİLİNÇLİ OLARAK YOK:
 * ölçü kodu ölçüden, versiyon renk+hammaddeden, tedarikçi harfi ilk kullanım
 * sırasından türetilir. Ölçüler `measurementTypeId` ile değil ürün modelinin ölçü
 * ŞABLONUNDAKİ `requirementId` ile gelir — aynı ölçü tipi bir modelde iki farklı
 * anlamda kullanılabilir ("Kol Çapı R" / "Elcik Çapı R").
 */
export interface ICreateProductVariantBody {
    productId: string
    name: string
    colorId?: string
    materialIds?: string[]
    measurements: {
        requirementId: string
        value: number
    }[]
    supplier?: IVariantSupplierInput
}

export interface IUpdateProductVariantBody {
    name: string
}

export type ICreateProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<ICreateProductVariantBody>

export type IUpdateProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IUpdateProductVariantBody,
        { id: string }
    >

export type IGetProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IDeleteProductVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IListProductVariantsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            productId?: string
        }
    >
