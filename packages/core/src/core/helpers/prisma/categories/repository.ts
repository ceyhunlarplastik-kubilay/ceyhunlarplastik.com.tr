import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Category, Asset } from "@/prisma/generated/prisma/client"

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
    getCategoryBySlug(slug: string): Promise<Category | null>
    createCategory(data: Prisma.CategoryCreateInput): Promise<Category>
    updateCategory(id: string, data: Prisma.CategoryUpdateInput): Promise<Category>
    deleteCategory(id: string): Promise<Category>
}

function mapAsset(asset: Asset) {
    return {
        id: asset.id,
        key: asset.key,
        mimeType: asset.mimeType,
        type: asset.type,
        role: asset.role,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
    }
}

function mapCategory(category: Category & { assets: Asset[] }) {
    return {
        id: category.id,
        code: category.code,
        name: category.name,
        slug: category.slug,
        allowedAttributeValueIds: (category as any).allowedAttributeValueIds ?? [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        assets: category.assets?.map(mapAsset) ?? [],
    }
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
                include: { assets: true },
            }),
            prisma.category.count({ where: finalWhere }),
        ])

        /* return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }) */
        return buildPaginationResponse(
            data.map(mapCategory),
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        )
    }

    const getCategory = async (id: string) => {
        return prisma.category.findUniqueOrThrow({
            where: { id },
            include: { assets: true },
        })
    }

    const getCategoryBySlug = async (slug: string) => {
        return prisma.category.findUniqueOrThrow({
            where: { slug },
            include: { assets: true },
        })
    }

    const createCategory = async (data: Prisma.CategoryCreateInput) => {
        return prisma.category.create({ data, include: { assets: true } })
    }

    const updateCategory = async (id: string, data: Prisma.CategoryUpdateInput) => {
        return prisma.category.update({
            where: { id },
            data,
            include: { assets: true },
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
        getCategoryBySlug,
        createCategory,
        updateCategory,
        deleteCategory,
    }
}
