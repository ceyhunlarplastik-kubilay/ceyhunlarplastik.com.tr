import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery";
function mapAsset(asset) {
    return {
        id: asset.id,
        key: asset.key,
        mimeType: asset.mimeType,
        type: asset.type,
        role: asset.role,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
    };
}
function mapCategory(category) {
    return {
        id: category.id,
        code: category.code,
        name: category.name,
        slug: category.slug,
        allowedAttributeValueIds: category.allowedAttributeValueIds ?? [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        assets: category.assets?.map(mapAsset) ?? [],
    };
}
export const categoryRepository = () => {
    const listCategories = async (query) => {
        const filterWhere = buildFilterQuery(query, [
            "name",
            "code"
        ]);
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["name", "code"],
            defaultSort: "code",
        });
        const finalWhere = {
            ...where,
            ...filterWhere,
        };
        const [data, total] = await Promise.all([
            prisma.category.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: { assets: true },
            }),
            prisma.category.count({ where: finalWhere }),
        ]);
        /* return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }) */
        return buildPaginationResponse(data.map(mapCategory), {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getCategory = async (id) => {
        return prisma.category.findUniqueOrThrow({
            where: { id },
            include: { assets: true },
        });
    };
    const getCategoryBySlug = async (slug) => {
        return prisma.category.findUniqueOrThrow({
            where: { slug },
            include: { assets: true },
        });
    };
    const createCategory = async (data) => {
        return prisma.category.create({ data, include: { assets: true } });
    };
    const updateCategory = async (id, data) => {
        return prisma.category.update({
            where: { id },
            data,
            include: { assets: true },
        });
    };
    const deleteCategory = async (id) => {
        return await prisma.category.delete({
            where: { id },
        });
    };
    return {
        listCategories,
        getCategory,
        getCategoryBySlug,
        createCategory,
        updateCategory,
        deleteCategory,
    };
};
