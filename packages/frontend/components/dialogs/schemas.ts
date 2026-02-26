import { z } from "zod";

export const productRequestSchema = z.object({
    companyName: z.string().min(2, "Firma adı zorunludur"),
    fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
    phone: z.string().min(10, "Telefon numarası geçersiz"),
    email: z.email("Geçerli bir email adresi giriniz"),
    product: z.string().min(2, "Talep edilen ürünü yazınız"),
});

export type ProductRequestValues = z.infer<typeof productRequestSchema>;

export const catalogRequestSchema = z.object({
    companyName: z.string().min(2, "Firma adı zorunludur"),
    fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
    phone: z.string().min(10, "Telefon numarası geçersiz"),
    address: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
});

export type CatalogRequestValues = z.infer<typeof catalogRequestSchema>;

export const mailSchema = z.object({
    fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
    phone: z.string().min(10, "Telefon numarası geçersiz"),
    email: z.email("Geçerli bir e-posta adresi giriniz"),
    message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
});

export type MailValues = z.infer<typeof mailSchema>;
