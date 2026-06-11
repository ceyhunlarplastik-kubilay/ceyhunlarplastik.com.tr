import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IPrismaCompanyContactRepository } from "@/core/helpers/prisma/companyContacts/repository"
import { IPrismaProductVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { IPrismaCustomerVariantSpecialPriceRepository } from "@/core/helpers/prisma/customerVariantSpecialPrices/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { CustomerCompanyContactAssignmentInput } from "@/core/helpers/crm/companyContactAssignments"
import type { CustomerStatus, CustomerVisitStatus } from "@/prisma/generated/prisma/enums"

export interface IProtectedCrmDependencies {
    customerRepository: IPrismaCustomerRepository
    supplierRepository: IPrismaSupplierRepository
    productAttributeValueRepository?: IPrismaProductAttributeValueRepository
    productRepository?: IPrismaProductRepository
    productVariantRepository?: IPrismaProductVariantRepository
    companyContactRepository?: IPrismaCompanyContactRepository
    customerVariantSpecialPriceRepository?: IPrismaCustomerVariantSpecialPriceRepository
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

export type IListManagedCustomerSpecialPricesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string },
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        isActive?: string
    }
>

export type IPortalCustomerSpecialPricesEvent = IAPIGatewayProxyEventWithUserGeneric<
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

export type ICustomerSpecialPriceBody = {
    productVariantId?: string
    price?: number
    currency?: string
    minOrderQuantity?: number | null
    maxOrderQuantity?: number | null
    paymentTermDays?: number | null
    paymentTermLabel?: string | null
    paymentSchedule?: Array<{
        percentage: number
        paymentTermDays: number
        label: string
        note?: string | null
    }> | null
    validFrom?: string | null
    validUntil?: string | null
    taxIncluded?: boolean
    deliveryTerm?: string | null
    contractReference?: string | null
    note?: string | null
    internalNote?: string | null
    isActive?: boolean
}

export type ICreateManagedCustomerSpecialPriceEvent = IAPIGatewayProxyEventWithUserGeneric<
    ICustomerSpecialPriceBody & {
        productVariantId: string
        price: number
    },
    { id: string }
>

export type IManagedCustomerSpecialPriceEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; specialPriceId: string }
>

export type IUpdateManagedCustomerSpecialPriceEvent = IAPIGatewayProxyEventWithUserGeneric<
    ICustomerSpecialPriceBody,
    { id: string; specialPriceId: string }
>

export type ICreatePortalCustomerAddressEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        label: string
        contactName?: string | null
        phone?: string | null
        email?: string | null
        countryId: number
        stateId: number
        cityId: number
        country?: string | null
        stateName?: string | null
        city: string
        district?: string | null
        line1: string
        line2?: string | null
        postalCode?: string | null
        taxOffice?: string | null
        taxNumber?: string | null
        isPrimary?: boolean
        isBilling?: boolean
        isShipping?: boolean
        note?: string | null
    }
>

export type IUpdateManagedCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    {
        companyName?: string | null
        fullName?: string
        phone?: string
        email?: string
        note?: string | null
        status?: CustomerStatus
        generalDiscountPercent?: number | null
        defaultPaymentTermDays?: number | null
        creditLimit?: number | null
        paymentTermNote?: string | null
        assignedSalesUserId?: string | null
        attributeValueIds?: string[]
        sectorValueId?: string | null
        productionGroupValueId?: string | null
        usageAreaValueIds?: string[]
        companyContactAssignments?: CustomerCompanyContactAssignmentInput[]
        addresses?: Array<{
            label: string
            contactName?: string | null
            phone?: string | null
            email?: string | null
            countryId?: number | null
            stateId?: number | null
            cityId?: number | null
            country?: string | null
            city: string
            district?: string | null
            line1: string
            line2?: string | null
            postalCode?: string | null
            taxOffice?: string | null
            taxNumber?: string | null
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
