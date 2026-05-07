import { z } from "zod"

export const resetPasswordRequestSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
    code: z.string().trim().min(4, "Doğrulama kodunu girin."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
})

export const resetPasswordSchema = z.object({
    email: resetPasswordRequestSchema.shape.email,
    code: resetPasswordRequestSchema.shape.code,
    password: resetPasswordRequestSchema.shape.password,
    confirmPassword: z.string().min(1, "Şifre tekrarını girin."),
}).refine((values) => values.password === values.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ResetPasswordRequestValues = z.infer<typeof resetPasswordRequestSchema>
