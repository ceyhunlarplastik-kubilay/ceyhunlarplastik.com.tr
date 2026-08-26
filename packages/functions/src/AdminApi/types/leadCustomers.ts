import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { CustomerAddressBody } from "@/core/helpers/crm/customerAddressInput"
import type { LeadCustomerProfileInput } from "@/core/helpers/crm/leadCustomers"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export interface ILeadCustomerDependencies {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    /** Oluşturma sırasında adres de gönderildiyse yazmak için. */
    customerRepository?: IPrismaCustomerRepository
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
        // Adres filtresi — normalize geo FK'ları, query string olduğu için metin.
        countryId?: string
        stateId?: string
        cityId?: string
    }
>

export type IDeleteLeadCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

/** Toplu silme — engelli kayıtlar işlemi düşürmez, ayrı raporlanır. */
export type IBulkDeleteLeadCustomersEvent = IAPIGatewayProxyEventWithUserGeneric<
    { ids: string[] },
    {}
>

export type IGetLeadCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateLeadCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<
    // Adres opsiyonel: oluşturma dialogunda girilirse aynı istekte yazılır.
    LeadCustomerProfileInput & { address?: CustomerAddressBody },
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
