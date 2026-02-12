import { IApiResponse, IApiResponseInput, IErrorResponseInput } from './types'

export const apiResponse = <TPayload>({ statusCode, payload }: IApiResponseInput<TPayload>): IApiResponse => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        /*
        Date Handling (Tarih Yönetimi):
        Veritabanından (Prisma) gelen verilerde createdAt, updatedAt gibi alanlar JavaScript Date objesidir.
        Zod validatörü ve JSON Schema, Date objelerini doğrudan doğrulayamaz (genelde ISO String beklerler).
        Bu uyumsuzluğu çözmek için apiResponse içinde JSON.parse(JSON.stringify(payload)) hilesini kullandık. Bu işlem tüm Date objelerini otomatik olarak ISO formatında string'e çevirir ve validatörün beklediği formata sokar.
         */
        body: {
            statusCode: statusCode,
            payload: payload,
        },
    }
}

export const errorResponse = ({ statusCode, detail }: IErrorResponseInput) => {
    return {
        headers: { 'Content-Type': 'application/json' },
        statusCode,
        body: JSON.stringify({ error: detail }),
    }
}

function normalizeDates<T>(input: T): any {
    if (input instanceof Date) {
        return input.toISOString()
    }

    if (Array.isArray(input)) {
        return input.map(normalizeDates)
    }

    if (input && typeof input === "object") {
        return Object.entries(input).reduce((acc, [key, value]) => {
            acc[key] = normalizeDates(value)
            return acc
        }, {} as any)
    }

    return input
}

export const apiResponseDTO = <TPayload>({
    statusCode,
    payload,
}: IApiResponseInput<TPayload>): IApiResponse => {
    const normalizedPayload = normalizeDates(payload)

    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: {
            statusCode,
            payload: normalizedPayload,
        },
    }
}
