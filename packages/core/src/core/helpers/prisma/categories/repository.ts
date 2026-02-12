import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Category } from "@/prisma/generated/prisma/client"

export interface IPrismaCategoryRepository {
    listCategories(query: IPaginationQuery): Promise<{
        data: Category[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getCategory(id: string): Promise<Category | null>
    createCategory(data: Prisma.CategoryCreateInput): Promise<Category>
    updateCategory(id: string, data: Prisma.CategoryUpdateInput): Promise<Category>
    deleteCategory(id: string): Promise<Category>
}

export const categoryRepository = (): IPrismaCategoryRepository => {

    const listCategories = async (query: IPaginationQuery & Record<string, any>) => {
        const filterWhere = buildFilterQuery<Category>(query, [
            "name",
            "code"
        ])

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<Category>(query, {
            searchableFields: ["name", "code"],
            defaultSort: "code",
        })

        const finalWhere = {
            ...where,
            ...filterWhere,
        }

        const [data, total] = await Promise.all([
            prisma.category.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
            }),
            prisma.category.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getCategory = async (id: string) => {
        return prisma.category.findUnique({
            where: { id },
        })
    }

    const createCategory = async (data: Prisma.CategoryCreateInput) => {
        return prisma.category.create({ data })
    }

    const updateCategory = async (id: string, data: Prisma.CategoryUpdateInput) => {
        return prisma.category.update({
            where: { id },
            data,
        })
    }

    const deleteCategory = async (id: string) => {
        return await prisma.category.delete({
            where: { id },
        })
    }

    return {
        listCategories,
        getCategory,
        createCategory,
        updateCategory,
        deleteCategory,
    }
}
