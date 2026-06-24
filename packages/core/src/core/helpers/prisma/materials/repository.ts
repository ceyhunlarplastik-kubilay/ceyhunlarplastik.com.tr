import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Material } from "@/prisma/generated/prisma/client"

export type MaterialWithAssets = Prisma.MaterialGetPayload<{
    include: {
        assets: true
    }
}>

type MaterialListQuery = IPaginationQuery & { certificateOnly?: boolean }

export interface IPrismaMaterialRepository {
    listMaterials(query: MaterialListQuery): Promise<{
        data: MaterialWithAssets[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getMaterial(id: string): Promise<MaterialWithAssets | null>
    createMaterial(data: Prisma.MaterialCreateInput): Promise<MaterialWithAssets>
    updateMaterial(id: string, data: Prisma.MaterialUpdateInput): Promise<MaterialWithAssets>
    deleteMaterial(id: string): Promise<MaterialWithAssets>
}

const materialInclude = {
    assets: {
        orderBy: [
            { createdAt: "desc" },
        ],
    },
} satisfies Prisma.MaterialInclude

export const materialRepository = (): IPrismaMaterialRepository => {

    const listMaterials = async (query: MaterialListQuery) => {

        const filterWhere = buildFilterQuery<Material>(query, [
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
        } = buildPaginationQuery<Material>(query, {
            searchableFields: ["name", "code"],
            defaultSort: "createdAt",
        })

        const finalWhere: Prisma.MaterialWhereInput = {
            ...where,
            ...filterWhere,
            ...(query.certificateOnly
                ? {
                    assets: {
                        some: {
                            type: "PDF",
                            role: "CERTIFICATE",
                        },
                    },
                }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.material.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: materialInclude,
            }),
            prisma.material.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getMaterial = async (id: string) =>
        prisma.material.findUnique({
            where: { id },
            include: materialInclude,
        })

    const createMaterial = async (data: Prisma.MaterialCreateInput) =>
        prisma.material.create({
            data,
            include: materialInclude,
        })

    const updateMaterial = async (id: string, data: Prisma.MaterialUpdateInput) =>
        prisma.material.update({
            where: { id },
            data,
            include: materialInclude,
        })

    const deleteMaterial = async (id: string) =>
        prisma.material.delete({
            where: { id },
            include: materialInclude,
        })

    return {
        listMaterials,
        getMaterial,
        createMaterial,
        updateMaterial,
        deleteMaterial,
    }
}
