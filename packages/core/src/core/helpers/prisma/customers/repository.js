import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
import { CustomerStatus, CustomerVisitStatus } from "@/prisma/generated/prisma/enums";
const customerBaseInclude = {
    sectorValue: {
        include: {
            attribute: true,
        },
    },
    productionGroupValue: {
        include: {
            attribute: true,
        },
    },
    usageAreaValues: {
        include: {
            attribute: true,
        },
    },
    assignedSalesUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
            groups: true,
        },
    },
    convertedByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
            groups: true,
        },
    },
};
const customerProductInclude = {
    createdByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
        },
    },
    product: {
        include: {
            category: true,
            assets: true,
            attributeValues: {
                include: {
                    attribute: true,
                },
            },
        },
    },
};
const customerDetailInclude = {
    ...customerBaseInclude,
    featuredProducts: {
        orderBy: {
            displayOrder: "asc",
        },
        include: customerProductInclude,
    },
    assignedProducts: {
        orderBy: {
            displayOrder: "asc",
        },
        include: customerProductInclude,
    },
    addresses: {
        orderBy: [
            { isPrimary: "desc" },
            { displayOrder: "asc" },
            { createdAt: "asc" },
        ],
    },
    visits: {
        orderBy: [
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ],
        include: {
            ownerUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
            createdByUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
        },
    },
};
export const customerRepository = () => {
    const listCustomers = async (query) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery(query, {
            searchableFields: ["fullName", "companyName", "email", "phone"],
            defaultSort: "createdAt",
        });
        const finalWhere = {
            ...where,
            ...(query.status ? { status: query.status } : {}),
            ...(query.assignedSalesUserId ? { assignedSalesUserId: query.assignedSalesUserId } : {}),
            ...(query.sectorValueId ? { sectorValueId: query.sectorValueId } : {}),
            ...(query.productionGroupValueId
                ? { productionGroupValueId: query.productionGroupValueId }
                : {}),
            ...(query.usageAreaValueId
                ? {
                    usageAreaValues: {
                        some: {
                            id: query.usageAreaValueId,
                        },
                    },
                }
                : {}),
        };
        const [data, total] = await Promise.all([
            prisma.customer.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: customerBaseInclude,
            }),
            prisma.customer.count({ where: finalWhere }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getCustomer = async (id) => prisma.customer.findUnique({
        where: { id },
        include: customerDetailInclude,
    });
    const createCustomer = async (data) => prisma.customer.create({
        data,
        include: customerBaseInclude,
    });
    const updateCustomer = async (id, data) => prisma.customer.update({
        where: { id },
        data,
        include: customerBaseInclude,
    });
    const convertCustomer = async (id, convertedByUserId) => prisma.customer.update({
        where: { id },
        data: {
            status: CustomerStatus.CUSTOMER,
            convertedAt: new Date(),
            convertedByUser: {
                connect: { id: convertedByUserId },
            },
        },
        include: customerBaseInclude,
    });
    const listFeaturedProducts = async (customerId) => prisma.customerFeaturedProduct.findMany({
        where: { customerId },
        orderBy: {
            displayOrder: "asc",
        },
        include: customerProductInclude,
    });
    const replaceFeaturedProducts = async (customerId, productIds, createdByUserId) => {
        const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
        await prisma.$transaction(async (tx) => {
            await tx.customerFeaturedProduct.deleteMany({
                where: { customerId },
            });
            if (uniqueProductIds.length > 0) {
                await tx.customerFeaturedProduct.createMany({
                    data: uniqueProductIds.map((productId, index) => ({
                        customerId,
                        productId,
                        displayOrder: index,
                        createdByUserId,
                    })),
                });
            }
        });
        return listFeaturedProducts(customerId);
    };
    const listAssignedProducts = async (customerId) => prisma.customerAssignedProduct.findMany({
        where: { customerId },
        orderBy: {
            displayOrder: "asc",
        },
        include: customerProductInclude,
    });
    const replaceAssignedProducts = async (customerId, productIds, createdByUserId) => {
        const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
        await prisma.$transaction(async (tx) => {
            await tx.customerAssignedProduct.deleteMany({
                where: { customerId },
            });
            if (uniqueProductIds.length > 0) {
                await tx.customerAssignedProduct.createMany({
                    data: uniqueProductIds.map((productId, index) => ({
                        customerId,
                        productId,
                        displayOrder: index,
                        createdByUserId,
                    })),
                });
            }
        });
        return listAssignedProducts(customerId);
    };
    const listVisits = async (customerId) => prisma.customerVisit.findMany({
        where: { customerId },
        orderBy: [
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ],
        include: customerDetailInclude.visits.include,
    });
    const createVisit = async (data) => prisma.customerVisit.create({
        data,
        include: customerDetailInclude.visits.include,
    });
    const updateVisit = async (id, data) => prisma.customerVisit.update({
        where: { id },
        data,
        include: customerDetailInclude.visits.include,
    });
    const deleteVisit = async (id) => prisma.customerVisit.delete({
        where: { id },
        include: customerDetailInclude.visits.include,
    });
    return {
        listCustomers,
        getCustomer,
        createCustomer,
        updateCustomer,
        convertCustomer,
        replaceFeaturedProducts,
        listFeaturedProducts,
        replaceAssignedProducts,
        listAssignedProducts,
        listVisits,
        createVisit,
        updateVisit,
        deleteVisit,
    };
};
export { CustomerStatus, CustomerVisitStatus };
