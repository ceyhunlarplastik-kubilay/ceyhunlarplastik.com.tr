import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const z_hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)
const translationSchema = z.object({
    id: z.uuid(),
    locale: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createColorValidator = validatorWrapper(
    z.object({
        body: z.object({
            system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]).default("RAL"),
            code: z.string().min(3).max(20),
            name: z.string().min(2).max(100),
            hex: z_hex,
            rgbR: z.number().min(0).max(255).optional(),
            rgbG: z.number().min(0).max(255).optional(),
            rgbB: z.number().min(0).max(255).optional(),
        }),
    }),
)

export const updateColorValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(2).max(100).optional(),
            isActive: z.boolean().optional(),
        }),
    }),
)

export const getColorValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

// Response Validators
// Shape, colorRepository'nin döndürdüğü tam Color modelinden türetildi (select yok).
// Permissive taraf: hex düz string (regex değil), rgb nullish (Int?), system enum
// schema.prisma'daki ColorSystem'den birebir.
const colorSchema = z.object({
    id: z.uuid(),
    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
    code: z.string(),
    name: z.string(),
    translations: z.array(translationSchema).optional(),
    hex: z.string(),
    rgbR: z.number().nullish(),
    rgbG: z.number().nullish(),
    rgbB: z.number().nullish(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// Tekil: getColor / createColor / updateColor → payload: { color }
export const colorResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                color: colorSchema,
            }),
        }),
    }).loose()
)

// Liste: listColors → payload: { colors: [...] } (ProtectedApi listActiveColors,
// AdminApi'deki data/meta paginasyonundan farklı)
export const listColorResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                colors: z.array(colorSchema),
            }),
        }),
    }).loose()
)
