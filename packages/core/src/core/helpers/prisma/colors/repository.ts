import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Color } from "@/prisma/generated/prisma/client"

export const colorTranslationSelect = {
    id: true,
    locale: true,
    name: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ColorTranslationSelect

const colorInclude = {
    translations: {
        orderBy: { locale: "asc" },
        select: colorTranslationSelect,
    },
} satisfies Prisma.ColorInclude

export type ColorWithTranslations = Prisma.ColorGetPayload<{
    include: typeof colorInclude
}>

type ColorListQuery = IPaginationQuery & Pick<Partial<Color>, "system" | "code" | "name">

export interface IPrismaColorRepository {
    listActiveColors(): Promise<ColorWithTranslations[]>
    listColors(query: ColorListQuery): Promise<{
        data: ColorWithTranslations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getColor(id: string): Promise<ColorWithTranslations | null>
    createColor(data: Prisma.ColorCreateInput): Promise<ColorWithTranslations>
    updateColor(id: string, data: Prisma.ColorUpdateInput): Promise<ColorWithTranslations>
    deleteColor(id: string): Promise<ColorWithTranslations>
}

export const colorRepository = (): IPrismaColorRepository => {
    const listActiveColors = async () => {
        return prisma.color.findMany({
            orderBy: { code: "asc" },
            include: colorInclude,
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
                include: colorInclude,
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
        return prisma.color.findUniqueOrThrow({
            where: { id },
            include: colorInclude,
        })
    }

    const createColor = async (data: Prisma.ColorCreateInput) => {
        return prisma.color.create({
            data,
            include: colorInclude,
        })
    }

    const updateColor = async (id: string, data: Prisma.ColorUpdateInput) => {
        return prisma.color.update({
            where: { id },
            data,
            include: colorInclude,
        })
    }

    const deleteColor = async (id: string) => {
        return await prisma.color.delete({
            where: { id },
            include: colorInclude,
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
