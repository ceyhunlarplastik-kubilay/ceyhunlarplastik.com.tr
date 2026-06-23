import { z } from "zod"
import { PHONE_INPUT_REGEX } from "@/core/helpers/validation/phone"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createMyProfileImageUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            fileName: z.string().trim().min(1).max(255),
            contentType: z.string().trim().min(1).max(100),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["fileName", "contentType"],
    }
)

export const updateMyProfileImageValidator = validatorWrapper(
    z.object({
        body: z.object({
            imageKey: z.string().trim().min(1).nullable(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["imageKey"],
    }
)

export const updateMyProfileValidator = validatorWrapper(
    z.object({
        body: z.object({
            identifier: z.string().trim().min(2).max(120).optional(),
            firstName: z.string().trim().min(2).max(120).optional(),
            lastName: z.string().trim().min(2).max(120).optional(),
            phone: z.string().trim().regex(
                PHONE_INPUT_REGEX,
                "Telefon numarasi yalnizca rakam, bosluk, parantez, tire ve + karakteri icerebilir.",
            ).nullable().optional(),
            customerContactTitle: z.string().trim().max(120).nullable().optional(),
            customerContactDepartment: z.string().trim().max(120).nullable().optional(),
        }).superRefine((value, ctx) => {
            const hasFirstName = value.firstName !== undefined
            const hasLastName = value.lastName !== undefined

            if (hasFirstName !== hasLastName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [hasFirstName ? "lastName" : "firstName"],
                    message: "Ad ve soyad birlikte guncellenmelidir.",
                })
            }
        }),
    }),
    {
        requiredRootFields: ["body"],
    },
)
