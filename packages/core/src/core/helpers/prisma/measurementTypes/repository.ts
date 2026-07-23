import { prisma } from "@/core/db/prisma"
import { Prisma, MeasurementType } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export const measurementTypeTranslationSelect = {
    id: true,
    locale: true,
    name: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.MeasurementTypeTranslationSelect

const measurementTypeInclude = {
    translations: {
        orderBy: { locale: "asc" },
        select: measurementTypeTranslationSelect,
    },
} satisfies Prisma.MeasurementTypeInclude

export type MeasurementTypeWithTranslations = Prisma.MeasurementTypeGetPayload<{
    include: typeof measurementTypeInclude
}>

type MeasurementTypeListQuery = IPaginationQuery & Pick<Partial<MeasurementType>, "code" | "baseUnit">

export interface IPrismaMeasurementTypeRepository {
    listMeasurementTypes(query: MeasurementTypeListQuery): Promise<{
        data: MeasurementTypeWithTranslations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getMeasurementType(id: string): Promise<MeasurementTypeWithTranslations | null>
    createMeasurementType(data: Prisma.MeasurementTypeCreateInput): Promise<MeasurementTypeWithTranslations>
    updateMeasurementType(id: string, data: Prisma.MeasurementTypeUpdateInput): Promise<MeasurementTypeWithTranslations>
    deleteMeasurementType(id: string): Promise<MeasurementTypeWithTranslations>
}

export const measurementTypeRepository = (): IPrismaMeasurementTypeRepository => {

    const listMeasurementTypes = async (query: MeasurementTypeListQuery) => {
        const filterWhere = buildFilterQuery<MeasurementType>(query, [
            "code",
            "baseUnit",
        ])

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

        const finalWhere: Prisma.MeasurementTypeWhereInput = {
            ...where,
            ...filterWhere,
        }

        const [data, total] = await Promise.all([
            prisma.measurementType.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: measurementTypeInclude,
            }),
            prisma.measurementType.count({ where: finalWhere }),
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
            prisma.measurementType.findUniqueOrThrow({
                where: { id },
                include: measurementTypeInclude,
            }),

        createMeasurementType: (data) =>
            prisma.measurementType.create({
                data,
                include: measurementTypeInclude,
            }),

        updateMeasurementType: (id, data) =>
            prisma.measurementType.update({
                where: { id },
                data,
                include: measurementTypeInclude,
            }),

        deleteMeasurementType: (id) =>
            prisma.measurementType.delete({
                where: { id },
                include: measurementTypeInclude,
            }),
    }
}
