export type AuthErrorCode =
    | "INVALID_CREDENTIALS"
    | "USER_NOT_CONFIRMED"
    | "CODE_MISMATCH"
    | "EXPIRED_CODE"
    | "USERNAME_EXISTS"
    | "TOO_MANY_REQUESTS"
    | "UNSUPPORTED_CHALLENGE"
    | "WEAK_PASSWORD"
    | "PASSWORD_RESET_REQUIRED"
    | "INVALID_PARAMETER"
    | "AUTH_SERVICE_UNAVAILABLE"
    | "UNKNOWN_AUTH_ERROR"

export class CognitoAuthError extends Error {
    code: AuthErrorCode
    statusCode: number

    constructor(code: AuthErrorCode, message: string, statusCode = 400) {
        super(message)
        this.name = "CognitoAuthError"
        this.code = code
        this.statusCode = statusCode
    }
}

export function getAuthErrorLogDetails(error: unknown) {
    if (error instanceof Error) {
        const metadata = "$metadata" in error && typeof error.$metadata === "object"
            ? error.$metadata as { httpStatusCode?: unknown; requestId?: unknown }
            : undefined

        return {
            name: error.name,
            message: error.message,
            statusCode: typeof metadata?.httpStatusCode === "number" ? metadata.httpStatusCode : undefined,
            requestId: typeof metadata?.requestId === "string" ? metadata.requestId : undefined,
        }
    }

    return {
        name: typeof error,
        message: "Non-error thrown",
    }
}

export function toCognitoAuthError(error: unknown): CognitoAuthError {
    if (error instanceof CognitoAuthError) {
        return error
    }

    const name = typeof error === "object" && error !== null && "name" in error
        ? String(error.name)
        : "UnknownError"
    const message = error instanceof Error ? error.message : ""

    if (
        name === "TimeoutError" ||
        message.includes("request socket did not establish") ||
        message.includes("PrivateLink access is disabled")
    ) {
        return new CognitoAuthError(
            "AUTH_SERVICE_UNAVAILABLE",
            "Kimlik doğrulama servisine şu anda ulaşılamıyor.",
            503,
        )
    }

    switch (name) {
        case "UserNotConfirmedException":
            return new CognitoAuthError("USER_NOT_CONFIRMED", "Hesabınızı doğrulamanız gerekiyor.", 403)
        case "NotAuthorizedException":
        case "UserNotFoundException":
            return new CognitoAuthError("INVALID_CREDENTIALS", "E-posta veya şifre hatalı.", 401)
        case "CodeMismatchException":
            return new CognitoAuthError("CODE_MISMATCH", "Doğrulama kodu hatalı.", 400)
        case "ExpiredCodeException":
            return new CognitoAuthError("EXPIRED_CODE", "Doğrulama kodunun süresi doldu.", 400)
        case "UsernameExistsException":
            return new CognitoAuthError("USERNAME_EXISTS", "Bu e-posta ile kayıtlı bir kullanıcı zaten var.", 409)
        case "TooManyRequestsException":
        case "LimitExceededException":
            return new CognitoAuthError("TOO_MANY_REQUESTS", "Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.", 429)
        case "InvalidPasswordException":
            return new CognitoAuthError("WEAK_PASSWORD", "Şifre politika koşullarını sağlamıyor.", 400)
        case "PasswordResetRequiredException":
            return new CognitoAuthError("PASSWORD_RESET_REQUIRED", "Şifrenizin sıfırlanması gerekiyor.", 403)
        case "InvalidParameterException":
            return new CognitoAuthError("INVALID_PARAMETER", "Gönderilen bilgiler geçersiz.", 400)
        default:
            return new CognitoAuthError("UNKNOWN_AUTH_ERROR", "Kimlik doğrulama işlemi tamamlanamadı.", 500)
    }
}
