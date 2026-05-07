import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { CognitoAuthError, toCognitoAuthError } from "@/features/auth/server/errors"

export function ok<T>(data: T) {
    return NextResponse.json({
        success: true as const,
        data,
    })
}

export function fail(error: unknown) {
    if (error instanceof ZodError) {
        return NextResponse.json({
            success: false as const,
            error: {
                code: "INVALID_PARAMETER" as const,
                message: "Gönderilen bilgiler geçersiz.",
            },
        }, { status: 400 })
    }

    const authError = error instanceof CognitoAuthError ? error : toCognitoAuthError(error)

    return NextResponse.json({
        success: false as const,
        error: {
            code: authError.code,
            message: authError.message,
        },
    }, { status: authError.statusCode })
}
