import { z } from "zod"

export const productAttributeMetadataSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Özellik adı en az 2 karakter olmalıdır."),
    code: z.string()
        .trim()
        .min(2, "Kod en az 2 karakter olmalıdır.")
        .regex(/^[a-z][a-z0-9_]*$/, "Kod küçük harf ve snake_case formatında olmalıdır."),
    displayOrder: z
        .number({ error: "Sıralama sayısal olmalıdır." })
        .int("Sıralama tam sayı olmalıdır.")
        .min(0, "Sıralama 0 veya daha büyük olmalıdır."),
    isCustomerAssignable: z.boolean(),
})

export type ProductAttributeMetadataFormValues = z.infer<typeof productAttributeMetadataSchema>
