import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery";
export const materialRepository = () => {
    const listMaterials = async (query) => {
        const filterWhere = buildFilterQuery(query, [
            "name",
            "code",
        ]);
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["name", "code"],
            defaultSort: "createdAt",
        });
        const finalWhere = {
            ...where,
            ...filterWhere,
        };
        const [data, total] = await Promise.all([
            prisma.material.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
            }),
            prisma.material.count({ where: finalWhere }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getMaterial = async (id) => prisma.material.findUnique({
        where: { id },
    });
    const createMaterial = async (data) => prisma.material.create({ data });
    const updateMaterial = async (id, data) => prisma.material.update({
        where: { id },
        data,
    });
    const deleteMaterial = async (id) => prisma.material.delete({
        where: { id },
    });
    return {
        listMaterials,
        getMaterial,
        createMaterial,
        updateMaterial,
        deleteMaterial,
    };
};
