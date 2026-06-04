import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { CompanyContact, Prisma } from "@/prisma/generated/prisma/client"

export type CompanyContactListQuery = IPaginationQuery & {
    isActive?: boolean
}

export interface IPrismaCompanyContactRepository {
    listCompanyContacts(query: CompanyContactListQuery): Promise<{
        data: CompanyContact[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    listActiveCompanyContacts(): Promise<CompanyContact[]>
    getCompanyContact(id: string): Promise<CompanyContact | null>
    createCompanyContact(data: Prisma.CompanyContactCreateInput): Promise<CompanyContact>
    updateCompanyContact(id: string, data: Prisma.CompanyContactUpdateInput): Promise<CompanyContact>
}

export const companyContactRepository = (): IPrismaCompanyContactRepository => {
    const listCompanyContacts = async (query: CompanyContactListQuery) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<CompanyContact>(query, {
            searchableFields: ["department", "name", "roleLabel", "email", "phone"],
            defaultSort: "displayOrder",
        })

        const finalWhere: Prisma.CompanyContactWhereInput = {
            ...where,
            ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        }

        const [data, total] = await Promise.all([
            prisma.companyContact.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
            }),
            prisma.companyContact.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listActiveCompanyContacts = () =>
        prisma.companyContact.findMany({
            where: { isActive: true },
            orderBy: [
                { displayOrder: "asc" },
                { department: "asc" },
                { name: "asc" },
            ],
        })

    const getCompanyContact = (id: string) =>
        prisma.companyContact.findUnique({
            where: { id },
        })

    const createCompanyContact = (data: Prisma.CompanyContactCreateInput) =>
        prisma.companyContact.create({ data })

    const updateCompanyContact = (id: string, data: Prisma.CompanyContactUpdateInput) =>
        prisma.companyContact.update({
            where: { id },
            data,
        })

    return {
        listCompanyContacts,
        listActiveCompanyContacts,
        getCompanyContact,
        createCompanyContact,
        updateCompanyContact,
    }
}
