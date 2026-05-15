import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery";
export const colorRepository = () => {
    const listActiveColors = async () => {
        return prisma.color.findMany({
            orderBy: { code: "asc" },
        });
    };
    const listColors = async (query) => {
        const filterWhere = buildFilterQuery(query, [
            "system",
            "code",
            "name"
        ]);
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["name", "code"],
            defaultSort: "code",
        });
        const finalWhere = {
            ...where,
            ...filterWhere,
        };
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
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getColor = async (id) => {
        return prisma.color.findUniqueOrThrow({
            where: { id },
        });
    };
    const createColor = async (data) => {
        return prisma.color.create({ data });
    };
    const updateColor = async (id, data) => {
        return prisma.color.update({
            where: { id },
            data,
        });
    };
    const deleteColor = async (id) => {
        return await prisma.color.delete({
            where: { id },
        });
    };
    return {
        listActiveColors,
        listColors,
        getColor,
        createColor,
        updateColor,
        deleteColor,
    };
};
