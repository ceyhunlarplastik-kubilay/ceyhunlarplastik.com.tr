import { describe, expect, it } from "vitest"
import { Prisma } from "@/prisma/generated/prisma/client"
import {
    DATABASE_CONNECTION_CAPACITY_MESSAGE,
    isDatabaseConnectionCapacityError,
} from "./errors"

function knownRequestError(code: string, message = "db error") {
    return new Prisma.PrismaClientKnownRequestError(message, {
        code,
        clientVersion: "test",
    })
}

describe("isDatabaseConnectionCapacityError", () => {
    it("matches the Prisma connection-limit error code P2037", () => {
        expect(isDatabaseConnectionCapacityError(knownRequestError("P2037"))).toBe(true)
    })

    it("does not match other Prisma known request errors", () => {
        expect(isDatabaseConnectionCapacityError(knownRequestError("P2002", "unique constraint"))).toBe(false)
        expect(isDatabaseConnectionCapacityError(knownRequestError("P2025", "record not found"))).toBe(false)
    })

    it.each([
        "too many database connections opened",
        "FATAL: too many connections for role",
        "sorry, too many clients already",
        "remaining connection slots are reserved",
    ])("matches the postgres capacity message pattern: %s", (message) => {
        expect(isDatabaseConnectionCapacityError(new Error(message))).toBe(true)
    })

    it("matches case-insensitively and on plain string errors", () => {
        expect(isDatabaseConnectionCapacityError("FATAL: TOO MANY CONNECTIONS")).toBe(true)
        expect(isDatabaseConnectionCapacityError("connection refused")).toBe(false)
    })

    it("reads message-shaped objects and falls back to JSON stringification", () => {
        expect(isDatabaseConnectionCapacityError({ message: "too many clients" })).toBe(true)
        // message alanı yoksa JSON.stringify edilen gövdede desen aranır
        expect(isDatabaseConnectionCapacityError({ detail: "sorry, too many clients already" })).toBe(true)
        expect(isDatabaseConnectionCapacityError({ detail: "disk full" })).toBe(false)
    })

    it("returns false for ordinary errors and non-error values", () => {
        expect(isDatabaseConnectionCapacityError(new Error("something broke"))).toBe(false)
        expect(isDatabaseConnectionCapacityError(null)).toBe(false)
        expect(isDatabaseConnectionCapacityError(undefined)).toBe(false)
        expect(isDatabaseConnectionCapacityError(42)).toBe(false)
    })
})

describe("DATABASE_CONNECTION_CAPACITY_MESSAGE", () => {
    it("is the user-facing Turkish capacity message used by the 503 response", () => {
        // httpErrorHandlerMiddleware bu sabiti 503 gövdesine koyar; metin
        // değişirse bilinçli olmalı (frontend'e kullanıcıya-görünür sızar).
        expect(DATABASE_CONNECTION_CAPACITY_MESSAGE).toContain("bağlantı kapasitesi")
    })
})
