import { describe, expect, it, vi } from "vitest"
import { FEDERATION_DENY_CODES, FederationDeniedError } from "./errors"
import {
    handleFederatedPreSignUp,
    maskEmail,
    type FederationRepository,
    type PreSignUpEventLike,
} from "./handlePreSignUp"

function buildRepository(overrides: Partial<FederationRepository> = {}) {
    const repository = {
        listUsersByEmail: vi.fn().mockResolvedValue([]),
        createLocalUser: vi.fn().mockResolvedValue({ username: "new-local-uuid" }),
        linkProvider: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    }

    return repository as typeof repository & FederationRepository
}

function buildEvent(overrides: Partial<PreSignUpEventLike> & { attributes?: Record<string, string> } = {}): PreSignUpEventLike {
    const { attributes, ...rest } = overrides

    return {
        userPoolId: "eu-west-1_POOL",
        userName: "Google_1084",
        request: {
            userAttributes: {
                email: "ali@firma.com",
                email_verified: "true",
                given_name: "Ali",
                family_name: "Veli",
                name: "Ali Veli",
                ...attributes,
            },
        },
        ...rest,
    }
}

const silent = () => undefined

describe("handleFederatedPreSignUp", () => {
    it("Google dışındaki sağlayıcıya dokunmaz", async () => {
        const repository = buildRepository()

        const outcome = await handleFederatedPreSignUp({
            event: buildEvent({ userName: "Facebook_7" }),
            repository,
            log: silent,
        })

        expect(outcome).toBe("PASSTHROUGH")
        expect(repository.listUsersByEmail).not.toHaveBeenCalled()
    })

    it("doğrulanmamış e-postayı Cognito'ya gitmeden reddeder", async () => {
        const repository = buildRepository()

        await expect(
            handleFederatedPreSignUp({
                event: buildEvent({ attributes: { email_verified: "false" } }),
                repository,
                log: silent,
            }),
        ).rejects.toMatchObject({ name: "FederationDeniedError", reason: "EMAIL_NOT_VERIFIED" })

        expect(repository.listUsersByEmail).not.toHaveBeenCalled()
        expect(repository.linkProvider).not.toHaveBeenCalled()
    })

    it("CONFIRMED yerel profile bağlar, yenisini açmaz", async () => {
        const repository = buildRepository({
            listUsersByEmail: vi.fn().mockResolvedValue([{ username: "existing-uuid", status: "CONFIRMED" }]),
        })

        const outcome = await handleFederatedPreSignUp({ event: buildEvent(), repository, log: silent })

        expect(outcome).toBe("LINKED_EXISTING")
        expect(repository.createLocalUser).not.toHaveBeenCalled()
        expect(repository.linkProvider).toHaveBeenCalledWith("eu-west-1_POOL", {
            providerName: "Google",
            providerUserId: "1084",
            nativeUsername: "existing-uuid",
        })
    })

    it("yerel profil yoksa açar ve OLUŞAN kullanıcı adına bağlar", async () => {
        const repository = buildRepository()

        const outcome = await handleFederatedPreSignUp({ event: buildEvent(), repository, log: silent })

        expect(outcome).toBe("CREATED_AND_LINKED")
        expect(repository.createLocalUser).toHaveBeenCalledWith("eu-west-1_POOL", {
            email: "ali@firma.com",
            firstName: "Ali",
            lastName: "Veli",
            name: "Ali Veli",
        })
        expect(repository.linkProvider).toHaveBeenCalledWith("eu-west-1_POOL", {
            providerName: "Google",
            providerUserId: "1084",
            nativeUsername: "new-local-uuid",
        })
    })

    it("görünen ad yoksa ad ve soyaddan türetir", async () => {
        const repository = buildRepository()

        await handleFederatedPreSignUp({
            event: buildEvent({ attributes: { name: "" } }),
            repository,
            log: silent,
        })

        expect(repository.createLocalUser).toHaveBeenCalledWith(
            "eu-west-1_POOL",
            expect.objectContaining({ name: "Ali Veli" }),
        )
    })

    it("kabul edilmemiş davet için engeller ve hiçbir şey yazmaz", async () => {
        const repository = buildRepository({
            listUsersByEmail: vi.fn().mockResolvedValue([{ username: "invited-uuid", status: "FORCE_CHANGE_PASSWORD" }]),
        })

        const promise = handleFederatedPreSignUp({ event: buildEvent(), repository, log: silent })

        await expect(promise).rejects.toBeInstanceOf(FederationDeniedError)
        await expect(promise).rejects.toMatchObject({
            reason: "INVITATION_PENDING",
            message: FEDERATION_DENY_CODES.INVITATION_PENDING,
        })
        expect(repository.createLocalUser).not.toHaveBeenCalled()
        expect(repository.linkProvider).not.toHaveBeenCalled()
    })

    it("küçük harfle bulunamazsa Google'ın ilettiği orijinal yazımla da dener", async () => {
        const listUsersByEmail = vi
            .fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ username: "legacy-uuid", status: "CONFIRMED" }])
        const repository = buildRepository({ listUsersByEmail })

        const outcome = await handleFederatedPreSignUp({
            event: buildEvent({ attributes: { email: "Ali@Firma.com" } }),
            repository,
            log: silent,
        })

        expect(outcome).toBe("LINKED_EXISTING")
        expect(listUsersByEmail).toHaveBeenNthCalledWith(1, "eu-west-1_POOL", "ali@firma.com")
        expect(listUsersByEmail).toHaveBeenNthCalledWith(2, "eu-west-1_POOL", "Ali@Firma.com")
        expect(repository.linkProvider).toHaveBeenCalledWith(
            "eu-west-1_POOL",
            expect.objectContaining({ nativeUsername: "legacy-uuid" }),
        )
    })

    it("eşzamanlı ilk girişte (UsernameExists) yeniden bakıp mevcut profile bağlar", async () => {
        const exists = Object.assign(new Error("exists"), { name: "UsernameExistsException" })
        const listUsersByEmail = vi
            .fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ username: "raced-uuid", status: "CONFIRMED" }])
        const repository = buildRepository({
            listUsersByEmail,
            createLocalUser: vi.fn().mockRejectedValue(exists),
        })

        const outcome = await handleFederatedPreSignUp({ event: buildEvent(), repository, log: silent })

        expect(outcome).toBe("LINKED_EXISTING")
        expect(repository.linkProvider).toHaveBeenCalledTimes(1)
        expect(repository.linkProvider).toHaveBeenCalledWith(
            "eu-west-1_POOL",
            expect.objectContaining({ nativeUsername: "raced-uuid" }),
        )
    })

    it("UsernameExists sonrası profil hâlâ bulunamıyorsa hata verir", async () => {
        const exists = Object.assign(new Error("exists"), { name: "UsernameExistsException" })
        const repository = buildRepository({ createLocalUser: vi.fn().mockRejectedValue(exists) })

        await expect(
            handleFederatedPreSignUp({ event: buildEvent(), repository, log: silent }),
        ).rejects.toThrow("could neither be created nor found")
    })

    it("beklenmeyen Cognito hatasını yutmaz (kapalı başarısız)", async () => {
        const repository = buildRepository({
            linkProvider: vi.fn().mockRejectedValue(new Error("boom")),
            listUsersByEmail: vi.fn().mockResolvedValue([{ username: "existing-uuid", status: "CONFIRMED" }]),
        })

        await expect(
            handleFederatedPreSignUp({ event: buildEvent(), repository, log: silent }),
        ).rejects.toThrow("boom")
    })

    it("reddederken teşhis için öznitelik ADLARINI ve email_verified değerini loglar (e-postayı değil)", async () => {
        const log = vi.fn()

        await expect(
            handleFederatedPreSignUp({
                event: buildEvent({ attributes: { email_verified: "false" } }),
                repository: buildRepository(),
                log,
            }),
        ).rejects.toBeInstanceOf(FederationDeniedError)

        expect(log).toHaveBeenCalledWith("federated sign-up denied", {
            reason: "EMAIL_NOT_VERIFIED",
            attributeKeys: ["email", "email_verified", "family_name", "given_name", "name"],
            emailVerified: "false",
        })
        expect(JSON.stringify(log.mock.calls)).not.toContain("ali@firma.com")
    })

    it("email_verified olayda hiç yoksa bunu null olarak loglar", async () => {
        const log = vi.fn()
        const event = buildEvent()
        delete event.request.userAttributes.email_verified

        await expect(
            handleFederatedPreSignUp({ event, repository: buildRepository(), log }),
        ).rejects.toMatchObject({ reason: "EMAIL_NOT_VERIFIED" })

        expect(log).toHaveBeenCalledWith(
            "federated sign-up denied",
            expect.objectContaining({ emailVerified: null }),
        )
    })

    it("loglara ham e-posta yazmaz", async () => {
        const log = vi.fn()
        const repository = buildRepository()

        await handleFederatedPreSignUp({ event: buildEvent(), repository, log })

        expect(log).toHaveBeenCalled()
        expect(JSON.stringify(log.mock.calls)).not.toContain("ali@firma.com")
    })
})

describe("maskEmail", () => {
    it("yerel kısmı gizler, alan adını korur", () => {
        expect(maskEmail("ali@firma.com")).toBe("a***@firma.com")
    })
})
