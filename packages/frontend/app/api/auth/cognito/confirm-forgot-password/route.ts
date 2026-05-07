import { NextRequest } from "next/server"
import { resetPasswordRequestSchema } from "@/features/auth/schema/resetPassword"
import { confirmForgotPasswordWithCognito } from "@/features/auth/server/confirm-forgot-password"
import { fail, ok } from "@/features/auth/server/http"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const payload = resetPasswordRequestSchema.parse(body)

        const result = await confirmForgotPasswordWithCognito(
            payload.email.trim().toLowerCase(),
            payload.code.trim(),
            payload.password,
        )

        return ok(result)
    } catch (error) {
        return fail(error)
    }
}
