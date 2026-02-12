import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const z_hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)

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
