import { z } from "zod"

// SERVER (app/api/auth/cognito/confirm-sign-up route) kullanıyor.
// React `t`'ye erişemez; mesaj TR kalır (backend mesaj lokalizasyonu = Faz 3).
export const confirmSignUpSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
    code: z.string().trim().min(4, "Doğrulama kodunu girin."),
})

// Client formu: factory (i18n).
type ValidationT = (key: string) => string

export function buildConfirmSignUpSchema(t: ValidationT) {
    return z.object({
        email: z.email(t("emailInvalid")),
        code: z.string().trim().min(4, t("codeMin")),
    })
}

export type ConfirmSignUpFormValues = z.infer<typeof confirmSignUpSchema>
