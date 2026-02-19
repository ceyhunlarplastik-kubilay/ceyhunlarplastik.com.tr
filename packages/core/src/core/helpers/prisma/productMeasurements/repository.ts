import { prisma } from "@/core/db/prisma"
import { Prisma, ProductMeasurement } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export interface IPrismaProductMeasurementRepository {
    listProductMeasurements(query: IPaginationQuery): Promise<{
        data: ProductMeasurement[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getProductMeasurement(id: string): Promise<ProductMeasurement | null>
    createProductMeasurement(data: Prisma.ProductMeasurementCreateInput): Promise<ProductMeasurement>
    updateProductMeasurement(id: string, data: Prisma.ProductMeasurementUpdateInput): Promise<ProductMeasurement>
    deleteProductMeasurement(id: string): Promise<ProductMeasurement>
    listMeasurementsByVariant(variantId: string): Promise<ProductMeasurement[]>
}

export const productMeasurementRepository = (): IPrismaProductMeasurementRepository => {

    const listProductMeasurements = async (query: IPaginationQuery) => {
        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<ProductMeasurement>(query, {
            searchableFields: ["label"],
            defaultSort: "createdAt",
        })

        const [data, total] = await Promise.all([
            prisma.productMeasurement.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    variant: true,
                    measurementType: true,
                },
            }),
            prisma.productMeasurement.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getProductMeasurement = async (id: string) =>
        prisma.productMeasurement.findUnique({
            where: { id },
            include: {
                variant: true,
                measurementType: true,
            },
        })

    const createProductMeasurement = async (data: Prisma.ProductMeasurementCreateInput) =>
        prisma.productMeasurement.create({ data })

    const updateProductMeasurement = async (id: string, data: Prisma.ProductMeasurementUpdateInput) =>
        prisma.productMeasurement.update({
            where: { id },
            data,
        })

    const deleteProductMeasurement = async (id: string) =>
        prisma.productMeasurement.delete({
            where: { id },
        })

    const listMeasurementsByVariant = async (variantId: string) =>
        prisma.productMeasurement.findMany({
            where: { variantId },
            include: {
                measurementType: true,
            },
        })

    return {
        listProductMeasurements,
        getProductMeasurement,
        createProductMeasurement,
        updateProductMeasurement,
        deleteProductMeasurement,
        listMeasurementsByVariant,
    }
}
