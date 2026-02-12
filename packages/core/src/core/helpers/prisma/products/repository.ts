import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Product } from "@/prisma/generated/prisma/client"

export interface IPrismaProductRepository {
    listProducts(query: IPaginationQuery & { categoryId?: string }): Promise<{
        data: Product[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
}

export const productRepository = (): IPrismaProductRepository => {

    const listProducts = async (query: IPaginationQuery & { categoryId?: string }) => {

        const filterWhere = buildFilterQuery<Product>(query, [
            "name",
            "code",
        ])

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<Product>(query, {
            searchableFields: ["name", "code"],
            defaultSort: "code",
        })

        const finalWhere = {
            ...where,
            ...filterWhere,
            ...(query.categoryId && { categoryId: query.categoryId }),
        }

        const [data, total] = await Promise.all([
            prisma.product.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: {
                    category: true,
                }
            }),
            prisma.product.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    return {
        listProducts,
    }
}
