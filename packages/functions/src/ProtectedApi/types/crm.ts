import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { CustomerStatus, CustomerVisitStatus } from "@/prisma/generated/prisma/enums"

export interface IProtectedCrmDependencies {
    customerRepository: IPrismaCustomerRepository
    supplierRepository: IPrismaSupplierRepository
    productAttributeValueRepository?: IPrismaProductAttributeValueRepository
    productRepository?: IPrismaProductRepository
}

export type IListManagedCustomersEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        sectorValueId?: string
        productionGroupValueId?: string
        usageAreaValueId?: string
        status?: CustomerStatus
        assignedSalesUserId?: string
    }
>

export type IManagedCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>

export type IUpdateManagedCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        companyName?: string | null
        fullName?: string
        phone?: string
        email?: string
        note?: string | null
        status?: CustomerStatus
        assignedSalesUserId?: string | null
        sectorValueId?: string | null
        productionGroupValueId?: string | null
        usageAreaValueIds?: string[]
        addresses?: Array<{
            label: string
            contactName?: string | null
            phone?: string | null
            email?: string | null
            country?: string | null
            city: string
            district?: string | null
            line1: string
            line2?: string | null
            postalCode?: string | null
            taxOffice?: string | null
            isPrimary?: boolean
            isBilling?: boolean
            isShipping?: boolean
            note?: string | null
        }>
    },
    { id: string }
>

export type IReplaceManagedCustomerFeaturedProductsEvent = IAPIGatewayProxyEventWithUserGeneric<
    { productIds: string[] },
    { id: string }
>

export type IReplaceManagedCustomerAssignedProductsEvent = IAPIGatewayProxyEventWithUserGeneric<
    { productIds: string[] },
    { id: string }
>

export type ICreateManagedCustomerVisitEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        ownerUserId: string
        scheduledAt: string
        title: string
        note?: string | null
        status?: CustomerVisitStatus
    },
    { id: string }
>

export type IUpdateManagedCustomerVisitEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        ownerUserId?: string
        scheduledAt?: string
        title?: string
        note?: string | null
        status?: CustomerVisitStatus
        completedAt?: string | null
    },
    { id: string; visitId: string }
>

export type IDeleteManagedCustomerVisitEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; visitId: string }
>

export type IListManagedSuppliersEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        assignedPurchasingUserId?: string
    }
>

export type IManagedSupplierEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>
