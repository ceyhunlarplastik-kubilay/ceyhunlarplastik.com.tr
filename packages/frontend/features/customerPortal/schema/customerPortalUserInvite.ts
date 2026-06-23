import { z } from "zod"

export const customerPortalUserInviteSchema = z.object({
    firstName: z.string().trim().min(2, "Ad en az 2 karakter olmalı."),
    lastName: z.string().trim().min(2, "Soyad en az 2 karakter olmalı."),
    email: z.email("Geçerli bir e-posta adresi girin."),
    customerContactTitle: z.string().trim().max(120, "Görev en fazla 120 karakter olabilir.").nullable().optional(),
    customerContactDepartment: z.string().trim().max(120, "Departman en fazla 120 karakter olabilir.").nullable().optional(),
    isPrimaryCustomerContact: z.boolean().optional(),
})

export type CustomerPortalUserInviteFormValues = z.infer<typeof customerPortalUserInviteSchema>

export function emptyCustomerPortalUserInvite(): CustomerPortalUserInviteFormValues {
    return {
        firstName: "",
        lastName: "",
        email: "",
        customerContactTitle: null,
        customerContactDepartment: null,
        isPrimaryCustomerContact: false,
    }
}
