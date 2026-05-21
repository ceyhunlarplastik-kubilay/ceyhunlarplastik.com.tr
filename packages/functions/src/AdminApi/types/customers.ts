import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { IPrismaProductRepository } from "@/core/helpers/prisma/products/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { CustomerStatus, CustomerVisitStatus } from "@/prisma/generated/prisma/enums"

export interface ICustomerDependencies {
    customerRepository: IPrismaCustomerRepository
    productAttributeValueRepository?: IPrismaProductAttributeValueRepository
    productRepository?: IPrismaProductRepository
}

export type IListCustomersEvent =
    IAPIGatewayProxyEventWithUserGeneric<
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

export type IGetCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>

export type IUpdateCustomerBody = {
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
}

export type IUpdateCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    IUpdateCustomerBody,
    { id: string }
>

export type IConvertCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>

export type IReplaceFeaturedProductsBody = {
    productIds: string[]
}

export type IReplaceCustomerFeaturedProductsEvent = IAPIGatewayProxyEventWithUserGeneric<
    IReplaceFeaturedProductsBody,
    { id: string }
>

export type IReplaceCustomerAssignedProductsEvent = IAPIGatewayProxyEventWithUserGeneric<
    IReplaceFeaturedProductsBody,
    { id: string }
>

export type IListCustomerVisitsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string }
>

export type ICreateCustomerVisitBody = {
    ownerUserId: string
    scheduledAt: string
    title: string
    note?: string | null
    status?: CustomerVisitStatus
}

export type ICreateCustomerVisitEvent = IAPIGatewayProxyEventWithUserGeneric<
    ICreateCustomerVisitBody,
    { id: string }
>

export type IUpdateCustomerVisitBody = {
    ownerUserId?: string
    scheduledAt?: string
    title?: string
    note?: string | null
    status?: CustomerVisitStatus
    completedAt?: string | null
}

export type IUpdateCustomerVisitEvent = IAPIGatewayProxyEventWithUserGeneric<
    IUpdateCustomerVisitBody,
    { id: string; visitId: string }
>

export type IDeleteCustomerVisitEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; visitId: string }
>
