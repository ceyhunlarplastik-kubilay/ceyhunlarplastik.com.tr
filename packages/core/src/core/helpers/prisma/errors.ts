import { Prisma } from "@/prisma/generated/prisma/client"

export const DATABASE_CONNECTION_CAPACITY_MESSAGE =
    "Veritabanı bağlantı kapasitesi geçici olarak doldu. Lütfen kısa süre sonra tekrar deneyin."

const CONNECTION_CAPACITY_ERROR_CODES = new Set(["P2037"])

const CONNECTION_CAPACITY_ERROR_PATTERNS = [
    "too many database connections",
    "too many connections",
    "too many clients",
    "remaining connection slots",
    "sorry, too many clients already",
]

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return `${error.name} ${error.message}`
    }

    if (typeof error === "string") {
        return error
    }

    if (error && typeof error === "object") {
        const maybeMessage = (error as { message?: unknown }).message
        if (typeof maybeMessage === "string") return maybeMessage

        try {
            return JSON.stringify(error)
        } catch {
            return ""
        }
    }

    return ""
}

export function isDatabaseConnectionCapacityError(error: unknown): boolean {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        CONNECTION_CAPACITY_ERROR_CODES.has(error.code)
    ) {
        return true
    }

    const message = getErrorMessage(error).toLowerCase()

    return CONNECTION_CAPACITY_ERROR_PATTERNS.some((pattern) =>
        message.includes(pattern),
    )
}
