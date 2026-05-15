import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery";
const defaultInclude = {
    product: true,
    color: true,
    materials: true,
    variantSuppliers: {
        include: { supplier: true }
    },
    measurements: {
        include: { measurementType: true }
    }
};
export const productVariantRepository = () => {
    const listProductVariants = async (query) => {
        const filterWhere = buildFilterQuery(query, [
            "fullCode",
            "name",
        ]);
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["fullCode", "name"],
            defaultSort: "createdAt",
        });
        const finalWhere = {
            ...where,
            ...filterWhere,
            ...(query.productId && { productId: query.productId }),
        };
        const [data, total] = await Promise.all([
            prisma.productVariant.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: defaultInclude
            }),
            prisma.productVariant.count({ where: finalWhere }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getProductVariant = async (id) => prisma.productVariant.findUnique({
        where: { id },
        include: defaultInclude
    });
    const countProductVariants = async (productId, versionCode) => prisma.productVariant.count({ where: { productId, versionCode } });
    const createProductVariant = async (data) => prisma.productVariant.create({
        data,
        include: defaultInclude
    });
    const updateProductVariant = async (id, data) => prisma.productVariant.update({
        where: { id },
        data,
        include: defaultInclude
    });
    const deleteProductVariant = async (id) => prisma.productVariant.delete({
        where: { id },
        include: defaultInclude,
    });
    const getProductVariantTableData = async (productId) => {
        return prisma.productVariant.findMany({
            where: { productId },
            orderBy: [
                { supplierCode: "asc" },
                { versionCode: "asc" },
                { variantIndex: "asc" },
            ],
            include: {
                color: true,
                materials: true,
                variantSuppliers: {
                    include: {
                        supplier: true,
                    },
                    orderBy: [
                        { isActive: "desc" },
                        { supplier: { name: "asc" } },
                    ],
                },
                measurements: {
                    orderBy: [
                        { measurementType: { displayOrder: "asc" } },
                        { measurementType: { code: "asc" } },
                        { value: "asc" },
                        { label: "asc" },
                    ],
                    include: {
                        measurementType: true
                    }
                }
            }
        });
    };
    return {
        listProductVariants,
        getProductVariant,
        countProductVariants,
        createProductVariant,
        updateProductVariant,
        deleteProductVariant,
        getProductVariantTableData,
    };
};
