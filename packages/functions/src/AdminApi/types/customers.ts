import { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

export interface ICustomerDependencies {
    customerRepository: IPrismaCustomerRepository
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
        }
    >
