import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Material } from "@/prisma/generated/prisma/client"

export interface IPrismaMaterialRepository {
    listMaterials(query: IPaginationQuery): Promise<{
        data: Material[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getMaterial(id: string): Promise<Material | null>
    createMaterial(data: Prisma.MaterialCreateInput): Promise<Material>
    updateMaterial(id: string, data: Prisma.MaterialUpdateInput): Promise<Material>
    deleteMaterial(id: string): Promise<Material>
}

export const materialRepository = (): IPrismaMaterialRepository => {

    const listMaterials = async (query: IPaginationQuery) => {

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

        const finalWhere = {
            ...where,
            ...filterWhere,
        }

        const [data, total] = await Promise.all([
            prisma.material.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
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
        })

    const createMaterial = async (data: Prisma.MaterialCreateInput) =>
        prisma.material.create({ data })

    const updateMaterial = async (id: string, data: Prisma.MaterialUpdateInput) =>
        prisma.material.update({
            where: { id },
            data,
        })

    const deleteMaterial = async (id: string) =>
        prisma.material.delete({
            where: { id },
        })

    return {
        listMaterials,
        getMaterial,
        createMaterial,
        updateMaterial,
        deleteMaterial,
    }
}
