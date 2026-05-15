import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
const supplierInclude = {
    assignedPurchasingUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
            groups: true,
        },
    },
};
export const supplierRepository = () => {
    const listSuppliers = async (query) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery(query, {
            searchableFields: ["name", "contactName", "taxNumber"],
            defaultSort: "createdAt",
        });
        const finalWhere = {
            ...where,
            ...(query.assignedPurchasingUserId
                ? { assignedPurchasingUserId: query.assignedPurchasingUserId }
                : {}),
        };
        const [data, total] = await Promise.all([
            prisma.supplier.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: supplierInclude,
            }),
            prisma.supplier.count({ where: finalWhere }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    return {
        listSuppliers,
        getSupplier: (id) => prisma.supplier.findUnique({
            where: { id },
            include: supplierInclude,
        }),
        createSupplier: (data) => prisma.supplier.create({
            data,
            include: supplierInclude,
        }),
        updateSupplier: (id, data) => prisma.supplier.update({
            where: { id },
            data,
            include: supplierInclude,
        }),
        deleteSupplier: (id) => prisma.supplier.delete({
            where: { id },
            include: supplierInclude,
        }),
    };
};
