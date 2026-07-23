import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IColorDependencies, ICreateColorEvent } from "@/functions/AdminApi/types/colors"
import { ColorSystem } from "@/functions/AdminApi/types/colors"
import { Prisma } from "@/prisma/generated/prisma/client"
import {
    normalizeVariantDictionaryTranslations,
    VariantDictionaryTranslationInputError,
} from "@/core/helpers/variantDictionaries/variantDictionaryTranslations"

function hexToRgb(hex: string) {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);

    if (clean.length === 6) {
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    }

    // 3-digit hex support
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);

    return { r, g, b };
}

export const createColorHandler = ({ colorRepository }: IColorDependencies) => {
    return async (event: ICreateColorEvent) => {
        const body = event.body;

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least  one field must be provided");

        const allowedFields = ["system", "code", "name", "hex", "translations"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { system, code, name, hex, translations } = body;

        const systemValue = system ?? ColorSystem.RAL;

        const { r, g, b } = hexToRgb(hex);

        try {
            const normalized = normalizeVariantDictionaryTranslations({
                legacyName: name,
                translations,
                requireTurkish: true,
            })
            const turkish = normalized.turkish!
            const color = await colorRepository.createColor({
                system: systemValue,
                code,
                name: turkish.name,
                hex,
                rgbR: r,
                rgbG: g,
                rgbB: b,
                translations: {
                    create: normalized.translations,
                },
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { color },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof VariantDictionaryTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") throw new createError.Conflict(`Color with system ${system} and code ${code} already exists`)
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create a color");
        }
    }
}
