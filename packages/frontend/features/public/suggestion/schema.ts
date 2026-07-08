import { z } from "zod";

// Form+zod i18n deseni: factory (bkz. components/dialogs/schemas.ts).
type ValidationT = (key: string) => string;

export function buildSuggestionFormSchema(t: ValidationT) {
    return z.object({
        fullName: z.string().min(2, t("fullNameMin")),
        email: z.string().email(t("emailInvalid")),
        phone: z.string().min(10, t("phoneInvalid")),
        type: z.enum(["suggestion", "complaint"], {
            message: t("typeRequired"),
        }),
        message: z.string().min(10, t("messageMin")),
        consent: z.boolean().refine((val) => val === true, {
            message: t("consentRequired"),
        }),
        // honeypot
        website: z.string().optional(),
    });
}

export type SuggestionFormValues = z.infer<
    ReturnType<typeof buildSuggestionFormSchema>
>;
