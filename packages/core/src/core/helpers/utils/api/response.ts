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
        body: JSON.parse(JSON.stringify({
            statusCode: statusCode,
            payload: payload,
        })),
    }
}

export const errorResponse = ({ statusCode, detail }: IErrorResponseInput) => {
    return {
        headers: { 'Content-Type': 'application/json' },
        statusCode,
        body: JSON.stringify({ error: detail }),
    }
}