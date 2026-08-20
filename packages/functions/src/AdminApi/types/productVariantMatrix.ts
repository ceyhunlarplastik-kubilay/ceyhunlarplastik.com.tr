import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantMatrixRepository } from "@/core/helpers/prisma/productVariantMatrix/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"

export interface IProductVariantMatrixDependencies {
    productVariantMatrixRepository: IPrismaProductVariantMatrixRepository
    productRepository: IPrismaProductRepository
}

export interface IVariantMatrixRowSupplierBody {
    supplierId: string
    isActive?: boolean
    price?: number
    /** Marj alanları — YALNIZ owner/admin/purchasing gönderebilir. */
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

export interface IVariantMatrixRowBody {
    name: string
    measurements: Array<{ requirementId: string; value: number }>
    colorId?: string
    materialIds?: string[]
    supplier?: IVariantMatrixRowSupplierBody
}

export type IGetVariantMatrixEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ISaveVariantMatrixEvent =
    IAPIGatewayProxyEventWithUserGeneric<{ rows: IVariantMatrixRowBody[] }, { id: string }>

export type ISetVariantCodeLockEvent =
    IAPIGatewayProxyEventWithUserGeneric<{ locked: boolean }, { id: string }>

export type IRenumberVariantCodesEvent =
    IAPIGatewayProxyEventWithUserGeneric<{ confirm: true }, { id: string }>
