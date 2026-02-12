import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Color } from "@/prisma/generated/prisma/client"

export interface IPrismaColorRepository {
    listActiveColors(): Promise<Color[]>
    listColors(query: IPaginationQuery): Promise<{
        data: Color[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getColor(id: string): Promise<Color | null>
    createColor(data: Prisma.ColorCreateInput): Promise<Color>
    updateColor(id: string, data: Prisma.ColorUpdateInput): Promise<Color>
    deleteColor(id: string): Promise<Color>
}

export const colorRepository = (): IPrismaColorRepository => {
    const listActiveColors = async () => {
        return prisma.color.findMany({
            orderBy: { code: "asc" },
        })
    }

    const listColors = async (query: IPaginationQuery & Record<string, any>) => {
        const filterWhere = buildFilterQuery<Color>(query, [
            "system",
            "code",
            "name"
        ])

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<Color>(query, {
            searchableFields: ["name", "code"],
            defaultSort: "code",
        })

        const finalWhere = {
            ...where,
            ...filterWhere,
        }

        // Soft delete condition
        // where.isActive = true

        const [data, total] = await Promise.all([
            prisma.color.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
            }),
            prisma.color.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getColor = async (id: string) => {
        return prisma.color.findUnique({
            where: { id },
        })
    }

    const createColor = async (data: Prisma.ColorCreateInput) => {
        return prisma.color.create({ data })
    }

    const updateColor = async (id: string, data: Prisma.ColorUpdateInput) => {
        return prisma.color.update({
            where: { id },
            data,
        })
    }

    const deleteColor = async (id: string) => {
        return await prisma.color.delete({
            where: { id },
        })
    }

    return {
        listActiveColors,
        listColors,
        getColor,
        createColor,
        updateColor,
        deleteColor,
    }
}
