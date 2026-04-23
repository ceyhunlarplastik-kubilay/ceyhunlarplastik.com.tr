import { prisma } from "@/core/db/prisma"
import { Customer, Prisma } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
    include: {
        sectorValue: {
            include: {
                attribute: true
            }
        }
        productionGroupValue: {
            include: {
                attribute: true
            }
        }
        usageAreaValues: {
            include: {
                attribute: true
            }
        }
    }
}>

export interface IPrismaCustomerRepository {
    listCustomers(
        query: IPaginationQuery & {
            sectorValueId?: string
            productionGroupValueId?: string
            usageAreaValueId?: string
        }
    ): Promise<{
        data: CustomerWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    createCustomer(data: Prisma.CustomerCreateInput): Promise<CustomerWithRelations>
}

export const customerRepository = (): IPrismaCustomerRepository => {
    const baseInclude = {
        sectorValue: {
            include: {
                attribute: true,
            },
        },
        productionGroupValue: {
            include: {
                attribute: true,
            },
        },
        usageAreaValues: {
            include: {
                attribute: true,
            },
        },
    } satisfies Prisma.CustomerInclude

    const listCustomers = async (
        query: IPaginationQuery & {
            sectorValueId?: string
            productionGroupValueId?: string
            usageAreaValueId?: string
        }
    ) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<Customer>(query, {
            searchableFields: ["fullName", "companyName", "email", "phone"],
            defaultSort: "createdAt",
        })

        const finalWhere: Prisma.CustomerWhereInput = {
            ...where,
            ...(query.sectorValueId && { sectorValueId: query.sectorValueId }),
            ...(query.productionGroupValueId && {
                productionGroupValueId: query.productionGroupValueId,
            }),
            ...(query.usageAreaValueId && {
                usageAreaValues: {
                    some: {
                        id: query.usageAreaValueId,
                    },
                },
            }),
        }

        const [data, total] = await Promise.all([
            prisma.customer.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: baseInclude,
            }),
            prisma.customer.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const createCustomer = async (data: Prisma.CustomerCreateInput) =>
        prisma.customer.create({
            data,
            include: baseInclude,
        })

    return {
        listCustomers,
        createCustomer,
    }
}
