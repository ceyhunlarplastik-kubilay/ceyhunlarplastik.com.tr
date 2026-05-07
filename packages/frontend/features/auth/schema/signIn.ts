import { z } from "zod"

export const signInSchema = z.object({
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: z.string().min(1, "Şifrenizi girin."),
})

export type SignInFormValues = z.infer<typeof signInSchema>
