import { z } from "zod"

// SERVER (app/api/auth/cognito/forgot-password + resend-confirmation route) kullanıyor.
// React `t`'ye erişemez; mesaj TR kalır (backend mesaj lokalizasyonu = Faz 3).
export const forgotPasswordSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
})

// Client formu: factory (i18n).
type ValidationT = (key: string) => string

export function buildForgotPasswordSchema(t: ValidationT) {
    return z.object({
        email: z.email(t("emailInvalid")),
    })
}

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
