import { prisma } from "@/core/db/prisma"
import { Prisma, WebRequest, WebRequestStatus } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export interface IPrismaWebRequestRepository {
    createWebRequest(data: Prisma.WebRequestCreateInput): Promise<WebRequest>
    updateWebRequestStatus(id: string, status: WebRequestStatus): Promise<WebRequest>
    listWebRequests(
        query: IPaginationQuery & {
            status?: string
        }
    ): Promise<{
        data: WebRequest[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
}

export const webRequestRepository = (): IPrismaWebRequestRepository => {
    const createWebRequest = (data: Prisma.WebRequestCreateInput) =>
        prisma.webRequest.create({
            data,
        })

    const updateWebRequestStatus = (id: string, status: WebRequestStatus) =>
        prisma.webRequest.update({
            where: { id },
            data: { status },
        })

    const listWebRequests = async (
        query: IPaginationQuery & {
            status?: string
        }
    ) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<WebRequest>(query, {
            searchableFields: ["name", "email", "phone", "message"],
            defaultSort: "createdAt",
        })

        const finalWhere: Prisma.WebRequestWhereInput = {
            ...where,
            ...(query.status ? { status: query.status } : {}),
        }

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
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    return {
        createWebRequest,
        updateWebRequestStatus,
        listWebRequests,
    }
}
