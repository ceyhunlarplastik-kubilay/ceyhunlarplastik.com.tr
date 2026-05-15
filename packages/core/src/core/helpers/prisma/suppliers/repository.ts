import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Supplier } from "@/prisma/generated/prisma/client"

const supplierInclude = {
    assignedPurchasingSuppliers: {
        select: {
            id: true,
            email: true,
            identifier: true,
            groups: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    },
} satisfies Prisma.SupplierInclude

export type SupplierWithRelations = Prisma.SupplierGetPayload<{
    include: typeof supplierInclude
}>

export interface IPrismaSupplierRepository {
    listSuppliers(query: IPaginationQuery & { assignedPurchasingUserId?: string }): Promise<{
        data: SupplierWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getSupplier(id: string): Promise<SupplierWithRelations | null>
    createSupplier(data: Prisma.SupplierCreateInput): Promise<SupplierWithRelations>
    updateSupplier(id: string, data: Prisma.SupplierUpdateInput): Promise<SupplierWithRelations>
    deleteSupplier(id: string): Promise<SupplierWithRelations>
}

export const supplierRepository = (): IPrismaSupplierRepository => {
    const listSuppliers = async (
        query: IPaginationQuery & { assignedPurchasingUserId?: string },
    ) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<Supplier>(query, {
            searchableFields: ["name", "contactName", "taxNumber"],
            defaultSort: "createdAt",
        })

        const finalWhere: Prisma.SupplierWhereInput = {
            ...where,
            ...(query.assignedPurchasingUserId
                ? {
                    assignedPurchasingSuppliers: {
                        some: {
                            id: query.assignedPurchasingUserId,
                        },
                    },
                }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.supplier.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: supplierInclude,
            }),
            prisma.supplier.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    return {
        listSuppliers,
        getSupplier: (id) =>
            prisma.supplier.findUnique({
                where: { id },
                include: supplierInclude,
            }),

        createSupplier: (data) =>
            prisma.supplier.create({
                data,
                include: supplierInclude,
            }),

        updateSupplier: (id, data) =>
            prisma.supplier.update({
                where: { id },
                data,
                include: supplierInclude,
            }),

        deleteSupplier: (id) =>
            prisma.supplier.delete({
                where: { id },
                include: supplierInclude,
            }),
    }
}
