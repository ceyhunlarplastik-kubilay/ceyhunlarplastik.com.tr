import { NextRequest } from "next/server"
import { confirmSignUpSchema } from "@/features/auth/schema/confirmSignUp"
import { confirmSignUpWithCognito } from "@/features/auth/server/confirm-sign-up"
import { fail, ok } from "@/features/auth/server/http"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const payload = confirmSignUpSchema.parse(body)

        const result = await confirmSignUpWithCognito(
            payload.email.trim().toLowerCase(),
            payload.code.trim(),
        )

        return ok(result)
    } catch (error) {
        return fail(error)
    }
}
