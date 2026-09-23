import { describe, expect, it } from "vitest"
import {
    assessFederatedIdentity,
    decideFederatedSignUp,
    parseFederatedUserName,
} from "./decideFederatedSignUp"

describe("parseFederatedUserName", () => {
    it("sağlayıcı ve sağlayıcıdaki kimliği ayırır", () => {
        expect(parseFederatedUserName("Google_108412345678901234567")).toEqual({
            providerName: "Google",
            providerUserId: "108412345678901234567",
        })
    })

    it("kimlikte alt çizgi varsa ilkinden böler", () => {
        expect(parseFederatedUserName("Google_abc_def")).toEqual({
            providerName: "Google",
            providerUserId: "abc_def",
        })
    })

    it("federe biçimde olmayan adı reddeder", () => {
        expect(parseFederatedUserName(undefined)).toBeNull()
        expect(parseFederatedUserName("")).toBeNull()
        expect(parseFederatedUserName("nounderscore")).toBeNull()
        expect(parseFederatedUserName("_123")).toBeNull()
        expect(parseFederatedUserName("Google_")).toBeNull()
    })
})

describe("assessFederatedIdentity", () => {
    const verified = { email: "Ali@Firma.com", email_verified: "true" }

    it("Google dışındaki sağlayıcıya dokunmaz", () => {
        expect(assessFederatedIdentity("Facebook_1", verified)).toEqual({ kind: "PASSTHROUGH" })
        expect(assessFederatedIdentity("kullanici-adi", verified)).toEqual({ kind: "PASSTHROUGH" })
    })

    it("e-posta yoksa reddeder", () => {
        expect(assessFederatedIdentity("Google_1", { email_verified: "true" })).toEqual({
            kind: "DENY",
            reason: "EMAIL_MISSING",
        })
        expect(assessFederatedIdentity("Google_1", { email: "   ", email_verified: "true" })).toEqual({
            kind: "DENY",
            reason: "EMAIL_MISSING",
        })
    })

    it("e-posta doğrulanmamışsa (yok, false) reddeder", () => {
        expect(assessFederatedIdentity("Google_1", { email: "a@b.com" })).toEqual({
            kind: "DENY",
            reason: "EMAIL_NOT_VERIFIED",
        })
        expect(assessFederatedIdentity("Google_1", { email: "a@b.com", email_verified: "false" })).toEqual({
            kind: "DENY",
            reason: "EMAIL_NOT_VERIFIED",
        })
    })

    it("doğrulanmış e-postayı küçük harfe çevirip kimlikle döndürür", () => {
        expect(assessFederatedIdentity("Google_42", verified)).toEqual({
            kind: "OK",
            identity: { providerName: "Google", providerUserId: "42" },
            email: "ali@firma.com",
        })
    })

    it("case-insensitive havuzda küçük harfli 'google_…' kullanıcı adını da tanır (regresyon: kubi 2026-09-22)", () => {
        // Cognito, `UsernameConfiguration.CaseSensitive: false` olan havuzlarda federe kullanıcı
        // adını TAMAMEN küçük harfe çevirir (IdP ön eki dahil) — `Google_…` değil `google_…` gelir.
        // Eski kod bunu `!==` ile karşılaştırıp PASSTHROUGH'a düşürüyordu; hiç hata vermeden hiçbir
        // Google girişi bağlanmıyordu.
        expect(assessFederatedIdentity("google_42", verified)).toEqual({
            kind: "OK",
            // `identity.providerName` HAM (küçük harfli) değeri DEĞİL, `AdminLinkProviderForUser`'ın
            // beklediği kanonik "Google"yı taşımalı.
            identity: { providerName: "Google", providerUserId: "42" },
            email: "ali@firma.com",
        })
    })
})

describe("decideFederatedSignUp", () => {
    it("yerel profil yoksa açıp bağlar", () => {
        expect(decideFederatedSignUp([])).toEqual({ action: "CREATE_AND_LINK" })
    })

    it("federe-yalnız kayıtları yok sayar", () => {
        expect(decideFederatedSignUp([{ username: "Google_9", status: "EXTERNAL_PROVIDER" }])).toEqual({
            action: "CREATE_AND_LINK",
        })
    })

    it("CONFIRMED yerel profile bağlar", () => {
        expect(decideFederatedSignUp([{ username: "uuid-1", status: "CONFIRMED" }])).toEqual({
            action: "LINK_EXISTING",
            nativeUsername: "uuid-1",
        })
        expect(
            decideFederatedSignUp([
                { username: "Google_9", status: "EXTERNAL_PROVIDER" },
                { username: "uuid-1", status: "CONFIRMED" },
            ]),
        ).toEqual({ action: "LINK_EXISTING", nativeUsername: "uuid-1" })
    })

    it("kabul edilmemiş davet (FORCE_CHANGE_PASSWORD) için engeller", () => {
        expect(decideFederatedSignUp([{ username: "uuid-1", status: "FORCE_CHANGE_PASSWORD" }])).toEqual({
            action: "DENY",
            reason: "INVITATION_PENDING",
        })
    })

    it("doğrulanmamış (UNCONFIRMED) kayıt için engeller", () => {
        expect(decideFederatedSignUp([{ username: "uuid-1", status: "UNCONFIRMED" }])).toEqual({
            action: "DENY",
            reason: "ACCOUNT_NOT_CONFIRMED",
        })
    })

    it("diğer durumlarda ve çoklu yerel profilde genel ret verir", () => {
        expect(decideFederatedSignUp([{ username: "uuid-1", status: "RESET_REQUIRED" }])).toEqual({
            action: "DENY",
            reason: "ACCOUNT_UNAVAILABLE",
        })
        expect(
            decideFederatedSignUp([
                { username: "uuid-1", status: "CONFIRMED" },
                { username: "uuid-2", status: "CONFIRMED" },
            ]),
        ).toEqual({ action: "DENY", reason: "ACCOUNT_UNAVAILABLE" })
    })
})
