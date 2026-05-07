import { z } from "zod"

export const confirmSignUpSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
    code: z.string().trim().min(4, "Doğrulama kodunu girin."),
})

export type ConfirmSignUpFormValues = z.infer<typeof confirmSignUpSchema>
