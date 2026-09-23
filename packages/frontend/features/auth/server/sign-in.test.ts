import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildSignInResult } from "@/features/auth/server/sign-in"
import { fetchAuthUserAccessState } from "@/features/auth/server/user-access"
import { CognitoAuthError } from "@/features/auth/server/errors"

vi.mock("@/features/auth/server/user-access", () => ({
    fetchAuthUserAccessState: vi.fn(),
}))

const fetchAccessState = vi.mocked(fetchAuthUserAccessState)

function makeIdToken(claims: Record<string, unknown>) {
    return `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`
}

const accessState = {
    dbUserId: "db-user-1",
    identifier: "Ali Veli",
    firstName: "Ali",
    lastName: "Veli",
    displayName: "Ali Veli",
    imageUrl: null,
    groups: ["user"],
    accessStatus: "PENDING_REVIEW" as const,
    customerId: null,
    supplierId: null,
    isActive: true,
}

const tokens = {
    idToken: makeIdToken({ sub: "cognito-sub-1", email: "ali@firma.com", name: "Ali (Google)" }),
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 1_900_000_000,
}

beforeEach(() => {
    fetchAccessState.mockReset()
})

describe("buildSignInResult", () => {
    it("OAuth girişinde kimliği ID token'dan, yetkiyi DB erişim durumundan üretir", async () => {
        fetchAccessState.mockResolvedValue(accessState)

        const result = await buildSignInResult(tokens)

        expect(fetchAccessState).toHaveBeenCalledWith(tokens.idToken)
        expect(result).toMatchObject({
            id: "cognito-sub-1",
            dbUserId: "db-user-1",
            email: "ali@firma.com",
            name: "Ali Veli",
            groups: ["user"],
            accessStatus: "PENDING_REVIEW",
            idToken: tokens.idToken,
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresAt: 1_900_000_000,
        })
    })

    it("görünen ad DB'de yoksa ID token adına, o da yoksa e-postaya düşer", async () => {
        fetchAccessState.mockResolvedValue({ ...accessState, displayName: "" })
        expect((await buildSignInResult(tokens)).name).toBe("Ali (Google)")

        const noName = { ...tokens, idToken: makeIdToken({ sub: "s", email: "ali@firma.com" }) }
        expect((await buildSignInResult(noName)).name).toBe("ali@firma.com")
    })

    it("ID token'da e-posta yoksa şifre girişinde yazılan adrese düşer", async () => {
        fetchAccessState.mockResolvedValue(accessState)
        const noEmail = { ...tokens, idToken: makeIdToken({ sub: "cognito-sub-1" }) }

        const result = await buildSignInResult(noEmail, "yazilan@firma.com")

        expect(result.email).toBe("yazilan@firma.com")
        expect(result.id).toBe("cognito-sub-1")
    })

    it("e-posta hiçbir yerde yoksa hata verir ve erişim durumuna hiç gitmez", async () => {
        const noEmail = { ...tokens, idToken: makeIdToken({ sub: "cognito-sub-1" }) }

        await expect(buildSignInResult(noEmail)).rejects.toMatchObject({
            name: "CognitoAuthError",
            code: "UNKNOWN_AUTH_ERROR",
        })
        expect(fetchAccessState).not.toHaveBeenCalled()
    })

    it("erişim durumu okunamazsa girişi reddeder (sessizce boş yetkiyle devam etmez)", async () => {
        fetchAccessState.mockRejectedValue(new Error("network down"))
        vi.spyOn(console, "error").mockImplementation(() => undefined)

        const promise = buildSignInResult(tokens)

        await expect(promise).rejects.toBeInstanceOf(CognitoAuthError)
        await expect(promise).rejects.toMatchObject({ code: "UNKNOWN_AUTH_ERROR", statusCode: 500 })
    })

    it("DB'de kullanıcı kaydı yoksa 404 ile reddeder", async () => {
        fetchAccessState.mockResolvedValue(null)

        await expect(buildSignInResult(tokens)).rejects.toMatchObject({
            code: "UNKNOWN_AUTH_ERROR",
            statusCode: 404,
        })
    })
})
