import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export interface ICustomerDependencies {
    customerRepository: IPrismaCustomerRepository
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
}

export interface ICreateCustomerBody {
    companyName?: string
    fullName: string
    phone: string
    email: string
    note?: string
    sectorValueId?: string
    productionGroupValueId?: string
    usageAreaValueIds?: string[]
}

export type ICreateCustomerEvent = IAPIGatewayProxyEventWithUserGeneric<ICreateCustomerBody>
