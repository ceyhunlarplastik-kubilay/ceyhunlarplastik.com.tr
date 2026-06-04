import type { IPrismaCompanyContactRepository } from "@/core/helpers/prisma/companyContacts/repository"
import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"

export interface ICompanyContactDependencies {
    companyContactRepository: IPrismaCompanyContactRepository
}

export type ICompanyContactBody = {
    department: string
    name: string
    roleLabel?: string | null
    email?: string | null
    phone?: string | null
    whatsappPhone?: string | null
    note?: string | null
    isActive?: boolean
    displayOrder?: number
}

export type IListCompanyContactsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        isActive?: string
    }
>

export type IGetCompanyContactEvent = IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type ICreateCompanyContactEvent = IAPIGatewayProxyEventWithUserGeneric<ICompanyContactBody>

export type IUpdateCompanyContactEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<ICompanyContactBody>,
    { id: string }
>
