import { z } from "zod"

export const signUpRequestSchema = z.object({
    firstName: z.string().trim().min(2, "Ad en az 2 karakter olmalı."),
    lastName: z.string().trim().min(2, "Soyad en az 2 karakter olmalı."),
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
})

export const signUpSchema = z.object({
    firstName: signUpRequestSchema.shape.firstName,
    lastName: signUpRequestSchema.shape.lastName,
    email: signUpRequestSchema.shape.email,
    password: signUpRequestSchema.shape.password,
    confirmPassword: z.string().min(1, "Şifre tekrarını girin."),
}).refine((values) => values.password === values.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
export type SignUpRequestValues = z.infer<typeof signUpRequestSchema>
