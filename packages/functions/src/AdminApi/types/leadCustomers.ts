import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { CustomerAddressBody } from "@/core/helpers/crm/customerAddressInput"
import type { LeadCustomerProfileInput } from "@/core/helpers/crm/leadCustomers"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export interface ILeadCustomerDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

export interface ILeadCustomerAddressDependencies {
    customerRepository: IPrismaCustomerRepository
}

export type IListLeadCustomersEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sectorValueId?: string
        usageAreaValueId?: string
    }
>

export type IGetLeadCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateLeadCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    LeadCustomerProfileInput,
    {}
>

export type IUpdateLeadCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    LeadCustomerProfileInput,
    { id: string }
>

export type ICreateLeadCustomerAddressEvent = IAPIGatewayProxyEventWithUserGeneric<
    CustomerAddressBody,
    { id: string }
>

export type IUpdateLeadCustomerAddressEvent = IAPIGatewayProxyEventWithUserGeneric<
    CustomerAddressBody,
    { id: string; addressId: string }
>

export type IDeleteLeadCustomerAddressEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { id: string; addressId: string }
>
