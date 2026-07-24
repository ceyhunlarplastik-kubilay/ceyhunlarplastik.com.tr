import { z } from "zod"

export const productIndustrialUsageFormSchema = z.object({
    id: z.uuid().nullable().optional(),
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    usageAreaValueId: z.uuid().nullable().optional(),
    usageFunction: z.string().max(2000).nullable().optional(),
    translations: z.array(z.object({
        locale: z.enum(["tr", "en"]),
        usageFunction: z.string().max(2000).nullable().optional(),
    })).optional(),
    imageKey: z.string().max(2048).nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    displayOrder: z.number().int().min(0).nullable().optional(),
})

export const productTranslationFormSchema = z.object({
    locale: z.enum(["tr", "en"]),
    name: z.string().max(255).nullable().optional(),
    slug: z.string().max(255).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
})

export const productFormSchema = z.object({
    name: z.string().min(2, "Ürün adı zorunlu"),
    code: z.string().min(1, "Kod zorunlu"),
    description: z.string().max(500).optional(),
    categoryId: z.uuid().min(1, "Kategori seçmelisiniz"),
    attributeValueIds: z.array(z.uuid()).optional(),
    industrialUsages: z.array(productIndustrialUsageFormSchema).optional(),
    translations: z.array(productTranslationFormSchema).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductIndustrialUsageFormValues = z.infer<typeof productIndustrialUsageFormSchema>;
export type ProductTranslationFormValues = z.infer<typeof productTranslationFormSchema>;
