import { z } from "zod"

export const signUpRequestSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
})

export const signUpSchema = z.object({
    email: signUpRequestSchema.shape.email,
    password: signUpRequestSchema.shape.password,
    confirmPassword: z.string().min(1, "Şifre tekrarını girin."),
}).refine((values) => values.password === values.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
export type SignUpRequestValues = z.infer<typeof signUpRequestSchema>
