import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
export const assetRepository = () => {
    const listAssets = async (query) => {
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["key"],
            defaultSort: "createdAt",
        });
        const [data, total] = await Promise.all([
            prisma.asset.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    category: true,
                    product: true,
                    variant: true,
                    productAttributeValue: true,
                }
            }),
            prisma.asset.count({ where }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getAsset = async (id) => prisma.asset.findUnique({
        where: { id },
        include: {
            category: true,
            product: true,
            variant: true,
            productAttributeValue: true,
        }
    });
    const listAssetsByCategoryId = async (categoryId) => prisma.asset.findMany({
        where: { categoryId },
    });
    const createAsset = async (data) => prisma.asset.create({ data });
    const updateAsset = async (id, data) => prisma.asset.update({
        where: { id },
        data,
    });
    const deleteAsset = async (id) => prisma.asset.delete({
        where: { id },
    });
    const deleteCategoryAssetsByType = async (categoryId, type) => {
        return prisma.asset.deleteMany({
            where: {
                categoryId,
                type,
            },
        });
    };
    const unsetCategoryPrimaryAssets = async (categoryId) => {
        return prisma.asset.updateMany({
            where: {
                categoryId,
                role: "PRIMARY",
            },
            data: {
                role: "GALLERY",
            },
        });
    };
    const unsetProductPrimaryAssets = async (productId) => {
        return prisma.asset.updateMany({
            where: {
                productId,
                role: "PRIMARY",
            },
            data: {
                role: "GALLERY",
            },
        });
    };
    const unsetProductAttributeValuePrimaryAssets = async (productAttributeValueId) => {
        return prisma.asset.updateMany({
            where: {
                productAttributeValueId,
                role: "PRIMARY",
            },
            data: {
                role: "GALLERY",
            },
        });
    };
    return {
        listAssets,
        getAsset,
        listAssetsByCategoryId,
        createAsset,
        updateAsset,
        deleteAsset,
        deleteCategoryAssetsByType,
        unsetCategoryPrimaryAssets,
        unsetProductPrimaryAssets,
        unsetProductAttributeValuePrimaryAssets,
    };
};
