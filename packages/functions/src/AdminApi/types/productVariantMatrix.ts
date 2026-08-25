import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantMatrixRepository } from "@/core/helpers/prisma/productVariantMatrix/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"
import { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

export interface IProductVariantMatrixDependencies {
    productVariantMatrixRepository: IPrismaProductVariantMatrixRepository
    productRepository: IPrismaProductRepository
}

export interface IVariantMatrixReferenceDependencies {
    colorRepository: IPrismaColorRepository
    materialRepository: IPrismaMaterialRepository
    supplierRepository: IPrismaSupplierRepository
    measurementTypeRepository: IPrismaMeasurementTypeRepository
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

/** Ölçü/renk/hammadde/tedarikçi kimliği burada DEĞİŞTİRİLEMEZ — bkz. handler. */
export interface IUpdateVariantMatrixSupplierBody {
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

export type IUpdateVariantMatrixSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IUpdateVariantMatrixSupplierBody,
        { id: string; supplierRowId: string }
    >

export type IDeleteVariantMatrixSupplierEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string; supplierRowId: string }>

export type IDeleteVariantMatrixVariantEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string; variantId: string }>

/** Toplu silme — engelli satırlar işlemi düşürmez, ayrı raporlanır. */
export type IBulkDeleteVariantMatrixVariantsEvent =
    IAPIGatewayProxyEventWithUserGeneric<{ variantIds: string[] }, { id: string }>
