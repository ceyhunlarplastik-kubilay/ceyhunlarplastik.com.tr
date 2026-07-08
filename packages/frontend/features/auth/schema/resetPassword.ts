import { z } from "zod"

// SERVER (app/api/auth/cognito/confirm-forgot-password route) kullanıyor.
// React `t`'ye erişemez; mesaj TR kalır (backend mesaj lokalizasyonu = Faz 3).
export const resetPasswordRequestSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
    code: z.string().trim().min(4, "Doğrulama kodunu girin."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
})

// Client formu: factory (i18n). confirmPassword + eşleşme kontrolü client-only.
type ValidationT = (key: string) => string

export function buildResetPasswordSchema(t: ValidationT) {
    return z.object({
        email: z.email(t("emailInvalid")),
        code: z.string().trim().min(4, t("codeMin")),
        password: z.string().min(8, t("passwordMin")),
        confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    }).refine((values) => values.password === values.confirmPassword, {
        message: t("passwordsMismatch"),
        path: ["confirmPassword"],
    })
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof buildResetPasswordSchema>>
export type ResetPasswordRequestValues = z.infer<typeof resetPasswordRequestSchema>
