import { z } from "zod";

// Form+zod i18n deseni: factory (bkz. components/dialogs/schemas.ts).
type ValidationT = (key: string) => string;

export function buildHrFormSchema(t: ValidationT) {
    return z.object({
        fullName: z.string().min(2, t("fullNameMin")),
        email: z.email(t("emailInvalid")),
        phone: z.string().min(10, t("phoneInvalid")),
        address: z.string().min(5, t("addressMin")),
        education: z.string().min(5, t("educationMin")),
        department: z.string().min(5, t("departmentMin")),
        message: z.string().min(20, t("messageMin")),
        cv: z
            .instanceof(File)
            .refine((file) => file.type === "application/pdf", {
                message: t("cvType"),
            })
            .refine((file) => file.size <= 5 * 1024 * 1024, {
                message: t("cvSize"),
            }),
        // Honeypot
        website: z.string().optional(),
    });
}

export type HrFormValues = z.infer<ReturnType<typeof buildHrFormSchema>>;
