import { z } from "zod"

export const forgotPasswordSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
