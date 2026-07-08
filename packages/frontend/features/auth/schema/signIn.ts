import { z } from "zod"

// Form+zod i18n deseni: factory (bkz. components/dialogs/schemas.ts).
type ValidationT = (key: string) => string

export function buildSignInSchema(t: ValidationT) {
    return z.object({
        email: z.email(t("emailInvalid")),
        password: z.string().min(1, t("passwordRequired")),
    })
}

export type SignInFormValues = z.infer<ReturnType<typeof buildSignInSchema>>
