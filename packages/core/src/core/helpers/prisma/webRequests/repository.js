import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
export const webRequestRepository = () => {
    const createWebRequest = (data) => prisma.webRequest.create({
        data,
    });
    const updateWebRequestStatus = (id, status) => prisma.webRequest.update({
        where: { id },
        data: { status },
    });
    const listWebRequests = async (query) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery(query, {
            searchableFields: ["name", "email", "phone", "message"],
            defaultSort: "createdAt",
        });
        const finalWhere = {
            ...where,
            ...(query.status ? { status: query.status } : {}),
        };
        const [data, total] = await Promise.all([
            prisma.webRequest.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
            }),
            prisma.webRequest.count({
                where: finalWhere,
            }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    return {
        createWebRequest,
        updateWebRequestStatus,
        listWebRequests,
    };
};
