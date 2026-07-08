import { z } from "zod"

// signUpRequestSchema: SERVER tarafı (app/api/auth/cognito/sign-up/route.ts) kullanıyor.
// React `t`'ye erişemez; mesajları TR kalır (backend mesaj lokalizasyonu = Faz 3).
export const signUpRequestSchema = z.object({
    firstName: z.string().trim().min(2, "Ad en az 2 karakter olmalı."),
    lastName: z.string().trim().min(2, "Soyad en az 2 karakter olmalı."),
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
})

// Client formu: factory (i18n). confirmPassword + eşleşme kontrolü client-only.
type ValidationT = (key: string) => string

export function buildSignUpSchema(t: ValidationT) {
    return z.object({
        firstName: z.string().trim().min(2, t("firstNameMin")),
        lastName: z.string().trim().min(2, t("lastNameMin")),
        email: z.email(t("emailInvalid")),
        password: z.string().min(8, t("passwordMin")),
        confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    }).refine((values) => values.password === values.confirmPassword, {
        message: t("passwordsMismatch"),
        path: ["confirmPassword"],
    })
}

export type SignUpFormValues = z.infer<ReturnType<typeof buildSignUpSchema>>
export type SignUpRequestValues = z.infer<typeof signUpRequestSchema>
