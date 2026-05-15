import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
export const productMeasurementRepository = () => {
    const listProductMeasurements = async (query) => {
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["label"],
            defaultSort: "createdAt",
        });
        const [data, total] = await Promise.all([
            prisma.productMeasurement.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    measurementType: true,
                },
            }),
            prisma.productMeasurement.count({ where }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getProductMeasurement = async (id) => prisma.productMeasurement.findUniqueOrThrow({
        where: { id },
        include: {
            measurementType: true,
        },
    });
    const createProductMeasurement = async (data) => prisma.productMeasurement.create({
        data,
        include: {
            measurementType: true,
        },
    });
    const updateProductMeasurement = async (id, data) => prisma.productMeasurement.update({
        where: { id },
        data,
        include: {
            measurementType: true,
        },
    });
    const deleteProductMeasurement = async (id) => prisma.productMeasurement.delete({
        where: { id },
        include: {
            measurementType: true,
        },
    });
    const listMeasurementsByVariant = async (variantId) => prisma.productMeasurement.findMany({
        where: { variantId },
        include: {
            measurementType: true,
        },
    });
    return {
        listProductMeasurements,
        getProductMeasurement,
        createProductMeasurement,
        updateProductMeasurement,
        deleteProductMeasurement,
        listMeasurementsByVariant,
    };
};
