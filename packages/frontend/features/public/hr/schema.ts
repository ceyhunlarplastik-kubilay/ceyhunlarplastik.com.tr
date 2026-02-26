import { z } from "zod";

export const hrFormSchema = z.object({
    fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
    email: z.email("Geçerli bir e-posta adresi giriniz"),
    phone: z.string().min(10, "Telefon numarası geçersiz"),
    address: z.string().min(5, "Adres en az 5 karakter olmalıdır"),
    education: z.string().min(5, "Eğitim bilgisi en az 5 karakter olmalıdır"),
    department: z.string().min(5, "Departman bilgisi en az 5 karakter olmalıdır"),
    message: z.string().min(20, "Mesaj en az 20 karakter olmalıdır"),
    cv: z
        .instanceof(File)
        .refine((file) => file.type === "application/pdf", {
            message: "Sadece PDF dosyaları kabul edilir",
        })
        .refine((file) => file.size <= 5 * 1024 * 1024, {
            message: "Dosya boyutu en fazla 5MB olabilir",
        }),
    // Honeypot
    website: z.string().optional(),
});

export type HrFormValues = z.infer<typeof hrFormSchema>;
