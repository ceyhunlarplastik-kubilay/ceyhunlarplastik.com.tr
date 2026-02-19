import { prisma } from "@/core/db/prisma"
import { Prisma, MeasurementType } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export interface IPrismaMeasurementTypeRepository {
    listMeasurementTypes(query: IPaginationQuery): Promise<{
        data: MeasurementType[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getMeasurementType(id: string): Promise<MeasurementType | null>
    createMeasurementType(data: Prisma.MeasurementTypeCreateInput): Promise<MeasurementType>
    updateMeasurementType(id: string, data: Prisma.MeasurementTypeUpdateInput): Promise<MeasurementType>
    deleteMeasurementType(id: string): Promise<MeasurementType>
}

export const measurementTypeRepository = (): IPrismaMeasurementTypeRepository => {

    const listMeasurementTypes = async (query: IPaginationQuery) => {

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<MeasurementType>(query, {
            searchableFields: ["name", "code", "baseUnit"],
            defaultSort: "createdAt",
        })

        const [data, total] = await Promise.all([
            prisma.measurementType.findMany({
                where,
                orderBy,
                skip,
                take,
            }),
            prisma.measurementType.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    return {
        listMeasurementTypes,
        getMeasurementType: (id) =>
            prisma.measurementType.findUnique({ where: { id } }),

        createMeasurementType: (data) =>
            prisma.measurementType.create({ data }),

        updateMeasurementType: (id, data) =>
            prisma.measurementType.update({
                where: { id },
                data,
            }),

        deleteMeasurementType: (id) =>
            prisma.measurementType.delete({
                where: { id },
            }),
    }
}
