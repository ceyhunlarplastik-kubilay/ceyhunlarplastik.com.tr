import { NextRequest } from "next/server"
import { signUpRequestSchema } from "@/features/auth/schema/signUp"
import { signUpWithCognito } from "@/features/auth/server/sign-up"
import { fail, ok } from "@/features/auth/server/http"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const payload = signUpRequestSchema.parse(body)

        const result = await signUpWithCognito(
            payload.email.trim().toLowerCase(),
            payload.password,
            payload.firstName,
            payload.lastName,
        )

        return ok(result)
    } catch (error) {
        return fail(error)
    }
}
