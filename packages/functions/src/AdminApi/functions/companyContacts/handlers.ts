import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import type {
    ICompanyContactBody,
    ICompanyContactDependencies,
    ICreateCompanyContactEvent,
    IGetCompanyContactEvent,
    IListCompanyContactsEvent,
    IUpdateCompanyContactEvent,
} from "@/functions/AdminApi/types/companyContacts"

const CONTACT_SORT_FIELDS = ["department", "name", "displayOrder", "createdAt"] as const

function nullableText(value: string | null | undefined) {
    if (value === undefined) return undefined
    const normalized = value?.trim() ?? ""
    return normalized || null
}

function buildCompanyContactData(body: Partial<ICompanyContactBody>) {
    return {
        ...(body.department !== undefined ? { department: body.department.trim() } : {}),
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.roleLabel !== undefined ? { roleLabel: nullableText(body.roleLabel) } : {}),
        ...(body.email !== undefined ? { email: nullableText(body.email) } : {}),
        ...(body.phone !== undefined ? { phone: nullableText(body.phone) } : {}),
        ...(body.whatsappPhone !== undefined ? { whatsappPhone: nullableText(body.whatsappPhone) } : {}),
        ...(body.note !== undefined ? { note: nullableText(body.note) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.displayOrder !== undefined ? { displayOrder: body.displayOrder } : {}),
    }
}

export const listCompanyContactsHandler = ({ companyContactRepository }: ICompanyContactDependencies) => {
    return async (event: IListCompanyContactsEvent) => {
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: CONTACT_SORT_FIELDS,
            defaultSort: "displayOrder",
        })

        const result = await companyContactRepository.listCompanyContacts({
            page,
            limit,
            search,
            sort,
            order,
            isActive: event.queryStringParameters?.isActive === undefined
                ? undefined
                : event.queryStringParameters.isActive === "true",
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: result.data,
                meta: result.meta,
            },
        })
    }
}

export const getCompanyContactHandler = ({ companyContactRepository }: ICompanyContactDependencies) => {
    return async (event: IGetCompanyContactEvent) => {
        const companyContact = await companyContactRepository.getCompanyContact(event.pathParameters.id)
        if (!companyContact) throw new createError.NotFound("Company contact not found")

        return apiResponseDTO({
            statusCode: 200,
            payload: { companyContact },
        })
    }
}

export const createCompanyContactHandler = ({ companyContactRepository }: ICompanyContactDependencies) => {
    return async (event: ICreateCompanyContactEvent) => {
        const companyContact = await companyContactRepository.createCompanyContact(
            buildCompanyContactData(event.body ?? {}) as Prisma.CompanyContactCreateInput,
        )

        return apiResponseDTO({
            statusCode: 201,
            payload: { companyContact },
        })
    }
}

export const updateCompanyContactHandler = ({ companyContactRepository }: ICompanyContactDependencies) => {
    return async (event: IUpdateCompanyContactEvent) => {
        const companyContact = await companyContactRepository.updateCompanyContact(
            event.pathParameters.id,
            buildCompanyContactData(event.body ?? {}),
        )

        return apiResponseDTO({
            statusCode: 200,
            payload: { companyContact },
        })
    }
}
