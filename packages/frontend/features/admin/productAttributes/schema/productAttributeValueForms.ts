import { z } from "zod"

export const productAttributeValueCreateSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Değer adı en az 2 karakter olmalıdır."),
    englishName: z.string().trim().optional(),
    parentValueId: z.string().optional(),
    imageFile: z.custom<File>().nullable().optional(),
})

export const productAttributeValueEditSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Değer adı en az 2 karakter olmalıdır."),
    englishName: z.string().trim().optional(),
    parentValueId: z.string().optional(),
})

export type ProductAttributeValueCreateFormValues = z.infer<typeof productAttributeValueCreateSchema>
export type ProductAttributeValueEditFormValues = z.infer<typeof productAttributeValueEditSchema>
