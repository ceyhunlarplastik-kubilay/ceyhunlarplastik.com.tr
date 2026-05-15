import type { IPrismaBusinessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository"
import type { IPrismaCategoryRepository } from "@/core/helpers/prisma/categories/repository"
import type { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaMaterialRepository } from "@/core/helpers/prisma/materials/repository"
import type { IPrismaMeasurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import type { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import type { IPrismaProductVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import type { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type {
    BusinessRequestDomain,
    BusinessRequestEntityType,
    BusinessRequestPriority,
    BusinessRequestStatus,
    BusinessRequestType,
} from "@/prisma/generated/prisma/client"

export interface IProtectedBusinessRequestDependencies {
    businessRequestRepository: IPrismaBusinessRequestRepository
    customerRepository: IPrismaCustomerRepository
    supplierRepository: IPrismaSupplierRepository
    categoryRepository: IPrismaCategoryRepository
    productRepository: IPrismaProductRepository
    productVariantSupplierRepository: IPrismaProductVariantSupplierRepository
    materialRepository: IPrismaMaterialRepository
    measurementTypeRepository: IPrismaMeasurementTypeRepository
    colorRepository: IPrismaColorRepository
    workflowArn: string
}

export type IListPortalBusinessRequestsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        status?: BusinessRequestStatus
        type?: BusinessRequestType
        domain?: BusinessRequestDomain
    }
>

export type ICreatePortalBusinessRequestEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        type: BusinessRequestType
        title?: string
        description?: string | null
        entityType?: BusinessRequestEntityType | null
        entityId?: string | null
        priority?: BusinessRequestPriority
        requestedData?: Record<string, unknown> | null
        items?: Array<{
            productVariantId?: string | null
            quantity?: number
            note?: string | null
            data?: Record<string, unknown> | null
        }>
    },
    {}
>

export type IListSalesBusinessRequestsEvent = IListPortalBusinessRequestsEvent
export type IListPurchasingBusinessRequestsEvent = IListPortalBusinessRequestsEvent
export type IListSupplierBusinessRequestsEvent = IListPortalBusinessRequestsEvent

export type IRequestSupplierProfileBusinessRequestEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        name?: string
        contactName?: string
        phone?: string
        address?: string
        taxNumber?: string
        defaultPaymentTermDays?: number
    },
    {}
>

export type IRequestSupplierVariantPricingBusinessRequestEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        price: number
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
    },
    { id: string }
>

export type ICreateSupplierBusinessRequestEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        type: Extract<
            BusinessRequestType,
            "SUPPLIER_CATEGORY_CREATE" | "SUPPLIER_PRODUCT_CREATE" | "SUPPLIER_VARIANT_CREATE"
        >
        title?: string
        description?: string | null
        priority?: BusinessRequestPriority
        requestedData: Record<string, unknown>
    },
    {}
>

export type IGetSupplierVariantRequestReferencesEvent = IAPIGatewayProxyEventWithUserGeneric<{}, {}>

export type IDecideBusinessRequestEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        approved?: boolean
        action?: "APPROVE" | "REJECT" | "COUNTER"
        note?: string
        counterOfferItems?: Array<{
            requestItemId: string
            proposedUnitPrice: number
            currency?: string | null
        }>
    },
    { id: string }
>
