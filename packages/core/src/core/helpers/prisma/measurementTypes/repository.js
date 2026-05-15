import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
export const measurementTypeRepository = () => {
    const listMeasurementTypes = async (query) => {
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["name", "code", "baseUnit"],
            defaultSort: "createdAt",
        });
        const [data, total] = await Promise.all([
            prisma.measurementType.findMany({
                where,
                orderBy,
                skip,
                take,
            }),
            prisma.measurementType.count({ where }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    return {
        listMeasurementTypes,
        getMeasurementType: (id) => prisma.measurementType.findUniqueOrThrow({ where: { id } }),
        createMeasurementType: (data) => prisma.measurementType.create({ data }),
        updateMeasurementType: (id, data) => prisma.measurementType.update({
            where: { id },
            data,
        }),
        deleteMeasurementType: (id) => prisma.measurementType.delete({
            where: { id },
        }),
    };
};
