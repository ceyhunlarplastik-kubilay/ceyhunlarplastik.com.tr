import { z } from "zod"

export const acceptCustomerInvitationRequestSchema = z.object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
})

export const acceptCustomerInvitationSchema = z.object({
    password: acceptCustomerInvitationRequestSchema.shape.password,
    confirmPassword: z.string().min(1, "Şifre tekrarını girin."),
}).refine((values) => values.password === values.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
})

export type AcceptCustomerInvitationFormValues = z.infer<typeof acceptCustomerInvitationSchema>
