import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier";
export const productVariantSupplierRepository = () => {
    const listProductVariantSuppliers = async (query) => {
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: [],
            defaultSort: "createdAt",
        });
        const finalWhere = {
            ...where,
            ...(query.variantId && { variantId: query.variantId }),
            ...(query.supplierId && { supplierId: query.supplierId }),
            ...((query.productId || query.categoryId) && {
                variant: {
                    ...(query.productId && { productId: query.productId }),
                    ...(query.categoryId && { product: { categoryId: query.categoryId } }),
                },
            }),
            ...(query.search && {
                OR: [
                    { variant: { name: { contains: query.search, mode: "insensitive" } } },
                    { variant: { fullCode: { contains: query.search, mode: "insensitive" } } },
                    { supplier: { name: { contains: query.search, mode: "insensitive" } } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            prisma.productVariantSupplier.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: {
                    variant: {
                        include: {
                            color: true,
                            materials: true,
                            measurements: {
                                include: {
                                    measurementType: true,
                                },
                                orderBy: [
                                    { measurementType: { displayOrder: "asc" } },
                                    { measurementType: { code: "asc" } },
                                    { value: "asc" },
                                    { label: "asc" },
                                ],
                            },
                            product: {
                                include: {
                                    category: true,
                                },
                            },
                        },
                    },
                    supplier: true,
                }
            }),
            prisma.productVariantSupplier.count({ where: finalWhere }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getProductVariantSupplier = async (id) => prisma.productVariantSupplier.findUnique({
        where: { id },
        include: {
            variant: {
                include: {
                    color: true,
                    materials: true,
                    measurements: {
                        include: {
                            measurementType: true,
                        },
                        orderBy: [
                            { measurementType: { displayOrder: "asc" } },
                            { measurementType: { code: "asc" } },
                            { value: "asc" },
                            { label: "asc" },
                        ],
                    },
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
            },
            supplier: true,
        }
    });
    const createProductVariantSupplier = async (data) => {
        // If isActive is true, we must deactivate other suppliers for this variant
        if (data.isActive && data.variant.connect?.id) {
            return prisma.$transaction(async (tx) => {
                await tx.productVariantSupplier.updateMany({
                    where: {
                        variantId: data.variant.connect?.id,
                        isActive: true,
                    },
                    data: { isActive: false },
                });
                return tx.productVariantSupplier.create({
                    data,
                    include: {
                        variant: {
                            include: {
                                color: true,
                                materials: true,
                                measurements: {
                                    include: {
                                        measurementType: true,
                                    },
                                    orderBy: [
                                        { measurementType: { displayOrder: "asc" } },
                                        { measurementType: { code: "asc" } },
                                        { value: "asc" },
                                        { label: "asc" },
                                    ],
                                },
                                product: {
                                    include: {
                                        category: true,
                                    },
                                },
                            },
                        },
                        supplier: true,
                    }
                });
            });
        }
        return prisma.productVariantSupplier.create({
            data,
            include: {
                variant: {
                    include: {
                        color: true,
                        materials: true,
                        measurements: {
                            include: {
                                measurementType: true,
                            },
                            orderBy: [
                                { measurementType: { displayOrder: "asc" } },
                                { measurementType: { code: "asc" } },
                                { value: "asc" },
                                { label: "asc" },
                            ],
                        },
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                supplier: true,
            }
        });
    };
    const updateProductVariantSupplier = async (id, data) => {
        // If setting isActive to true, deactivate others
        if (data.isActive === true) {
            const existing = await prisma.productVariantSupplier.findUnique({ where: { id } });
            if (existing) {
                return prisma.$transaction(async (tx) => {
                    await tx.productVariantSupplier.updateMany({
                        where: {
                            variantId: existing.variantId,
                            isActive: true,
                            id: { not: id } // Don't turn off myself if I'm already active (redundant but safe)
                        },
                        data: { isActive: false },
                    });
                    return tx.productVariantSupplier.update({
                        where: { id },
                        data,
                        include: {
                            supplier: true,
                            variant: {
                                include: {
                                    color: true,
                                    materials: true,
                                    measurements: {
                                        include: {
                                            measurementType: true,
                                        },
                                        orderBy: [
                                            { measurementType: { displayOrder: "asc" } },
                                            { measurementType: { code: "asc" } },
                                            { value: "asc" },
                                            { label: "asc" },
                                        ],
                                    },
                                    product: {
                                        include: {
                                            category: true,
                                        },
                                    },
                                },
                            },
                        }
                    });
                });
            }
        }
        return prisma.productVariantSupplier.update({
            where: { id },
            data,
            include: {
                supplier: true,
                variant: {
                    include: {
                        color: true,
                        materials: true,
                        measurements: {
                            include: {
                                measurementType: true,
                            },
                            orderBy: [
                                { measurementType: { displayOrder: "asc" } },
                                { measurementType: { code: "asc" } },
                                { value: "asc" },
                                { label: "asc" },
                            ],
                        },
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            }
        });
    };
    const deleteProductVariantSupplier = async (id) => prisma.productVariantSupplier.delete({
        where: { id },
        include: {
            variant: {
                include: {
                    color: true,
                    materials: true,
                    measurements: {
                        include: {
                            measurementType: true,
                        },
                        orderBy: [
                            { measurementType: { displayOrder: "asc" } },
                            { measurementType: { code: "asc" } },
                            { value: "asc" },
                            { label: "asc" },
                        ],
                    },
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
            },
            supplier: true,
        }
    });
    const listProductsBySupplier = async (query) => {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
        const skip = (page - 1) * limit;
        const order = query.order === "desc" ? "desc" : "asc";
        const productWhere = {
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" } },
                        { code: { contains: query.search, mode: "insensitive" } },
                    ],
                }
                : {}),
            ...(query.categoryId ? { categoryId: query.categoryId } : {}),
            variants: {
                some: {
                    variantSuppliers: {
                        some: {
                            ...(query.supplierId ? { supplierId: query.supplierId } : {}),
                        },
                    },
                },
            },
        };
        const [rows, total] = await Promise.all([
            prisma.product.findMany({
                where: productWhere,
                orderBy: (query.sort === "updatedAt" || query.sort === "createdAt" || query.sort === "name" || query.sort === "code")
                    ? { [query.sort]: order }
                    : { name: "asc" },
                skip,
                take: limit,
                include: {
                    category: true,
                    assets: {
                        select: {
                            id: true,
                            role: true,
                            key: true,
                        },
                        orderBy: { createdAt: "desc" },
                    },
                    variants: {
                        where: {
                            variantSuppliers: {
                                some: {
                                    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
                                },
                            },
                        },
                        select: { id: true },
                    },
                },
            }),
            prisma.product.count({ where: productWhere }),
        ]);
        const data = rows.map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            slug: row.slug,
            categoryId: row.categoryId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            category: row.category,
            assets: row.assets.map((asset) => ({
                id: asset.id,
                role: asset.role,
                url: `${process.env.ASSET_PUBLIC_BASE_URL ?? ""}/${asset.key}`,
            })),
            variantCount: row.variants.length,
        }));
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const bulkUpdatePricingByProduct = async (input) => {
        const rows = await prisma.productVariantSupplier.findMany({
            where: {
                ...(input.supplierId ? { supplierId: input.supplierId } : {}),
                variant: {
                    productId: input.productId,
                },
            },
            select: {
                id: true,
                price: true,
                operationalCostRate: true,
                profitRate: true,
            },
        });
        if (rows.length === 0) {
            return { count: 0 };
        }
        await prisma.$transaction(rows.map((row) => {
            const pricing = resolveProductVariantSupplierPricing({
                price: Number(row.price),
                operationalCostRate: input.operationalCostRate,
                profitRate: input.profitRate,
            }, {
                operationalCostRate: row.operationalCostRate,
                profitRate: row.profitRate,
            });
            return prisma.productVariantSupplier.update({
                where: { id: row.id },
                data: {
                    ...pricing,
                },
            });
        }));
        return { count: rows.length };
    };
    return {
        listProductVariantSuppliers,
        getProductVariantSupplier,
        createProductVariantSupplier,
        updateProductVariantSupplier,
        deleteProductVariantSupplier,
        listProductsBySupplier,
        bulkUpdatePricingByProduct,
    };
};
