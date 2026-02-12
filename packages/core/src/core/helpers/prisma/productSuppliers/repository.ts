import { prisma } from "@/core/db/prisma"
import { Prisma, ProductSupplier } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export interface IPrismaProductSupplierRepository {
    listProductSuppliers(query: IPaginationQuery): Promise<{
        data: ProductSupplier[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getProductSupplier(id: string): Promise<ProductSupplier | null>
    createProductSupplier(data: Prisma.ProductSupplierCreateInput): Promise<ProductSupplier>
    updateProductSupplier(id: string, data: Prisma.ProductSupplierUpdateInput): Promise<ProductSupplier>
    deleteProductSupplier(id: string): Promise<ProductSupplier>
}

export const productSupplierRepository = (): IPrismaProductSupplierRepository => {

    const listProductSuppliers = async (query: IPaginationQuery & Record<string, any>) => {

        // 🔎 Optional filter (istersen productId / supplierId filtreleyebiliriz)
        const filterWhere = buildFilterQuery<ProductSupplier>(query, [
            "productId",
            "supplierId",
            "catalogCode",
        ])

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<ProductSupplier>(query, {
            searchableFields: ["catalogCode"],
            defaultSort: "createdAt",
        })

        const finalWhere = {
            ...where,
            ...filterWhere,
        }

        const [data, total] = await Promise.all([
            prisma.productSupplier.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: {
                    product: true,
                    supplier: true,
                },
            }),
            prisma.productSupplier.count({
                where: finalWhere,
            }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getProductSupplier = async (id: string) =>
        prisma.productSupplier.findUnique({
            where: { id },
            include: {
                product: true,
                supplier: true,
            },
        })

    const createProductSupplier = async (
        data: Prisma.ProductSupplierCreateInput
    ) => prisma.productSupplier.create({ data })

    const updateProductSupplier = async (
        id: string,
        data: Prisma.ProductSupplierUpdateInput
    ) =>
        prisma.productSupplier.update({
            where: { id },
            data,
        })

    const deleteProductSupplier = async (id: string) =>
        prisma.productSupplier.delete({
            where: { id },
        })

    return {
        listProductSuppliers,
        getProductSupplier,
        createProductSupplier,
        updateProductSupplier,
        deleteProductSupplier,
    }
}
