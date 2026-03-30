import { z } from "zod";

export const suggestionFormSchema = z.object({
    fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    phone: z.string().min(10, "Telefon numarası geçersiz"),
    type: z.enum(["suggestion", "complaint"], {
        message: "Bildirim türü seçiniz",
    }),
    message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
    consent: z.boolean().refine((val) => val === true, {
        message: "Gizlilik politikasını kabul etmelisiniz",
    }),

    // honeypot
    website: z.string().optional(),
});

export type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;