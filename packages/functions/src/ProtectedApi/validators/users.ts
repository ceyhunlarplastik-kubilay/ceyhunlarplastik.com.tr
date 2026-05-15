import { z } from "zod"
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
