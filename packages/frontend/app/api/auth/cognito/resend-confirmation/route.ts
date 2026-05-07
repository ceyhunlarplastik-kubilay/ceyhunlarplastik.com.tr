import { NextRequest } from "next/server"
import { forgotPasswordSchema } from "@/features/auth/schema/forgotPassword"
import { resendConfirmationWithCognito } from "@/features/auth/server/resend-confirmation"
import { fail, ok } from "@/features/auth/server/http"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const payload = forgotPasswordSchema.parse(body)

        const result = await resendConfirmationWithCognito(payload.email.trim().toLowerCase())
        return ok(result)
    } catch (error) {
        return fail(error)
    }
}
