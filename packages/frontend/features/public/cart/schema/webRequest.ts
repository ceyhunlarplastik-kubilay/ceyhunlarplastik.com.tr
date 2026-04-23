import { z } from "zod"

export const inquiryCartItemSchema = z.object({
    productId: z.string().min(1),
    productSlug: z.string().optional(),
    productName: z.string().optional(),
    productCode: z.string().optional(),
    variantKey: z.string().min(1),
    variantId: z.string().optional(),
    variantFullCode: z.string().nullable().optional(),
    quantity: z.number().int().min(1),
})

export const webRequestFormSchema = z.object({
    name: z.string().min(2, "Ad soyad en az 2 karakter olmalı."),
    email: z.email("Geçerli bir e-posta girin."),
    phone: z.string().min(7, "Telefon numarası çok kısa.").max(40).optional().or(z.literal("")),
    message: z.string().max(5000, "Mesaj en fazla 5000 karakter olabilir.").optional().or(z.literal("")),
    items: z.array(inquiryCartItemSchema).min(1, "Sepet boş olamaz."),
})

export type WebRequestFormValues = z.infer<typeof webRequestFormSchema>

