import { z } from "zod"

export const productFormSchema = z.object({
    name: z.string().min(2, "Ürün adı zorunlu"),
    code: z.string().min(1, "Kod zorunlu"),
    description: z.string().max(500).optional(),
    categoryId: z.uuid().min(1, "Kategori seçmelisiniz"),
    attributeValueIds: z.array(z.uuid()).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>;
