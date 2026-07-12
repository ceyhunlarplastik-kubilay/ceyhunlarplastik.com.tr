import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "http-errors"

// Gerçek prisma.ts modül scope'unda sst Resource'a dokunur (sst shell dışında
// patlar); ayrıca middleware'in DB davranışını kontrol etmek için mock şart.
vi.mock("@/core/db/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}))

import { prisma } from "@/core/db/prisma"
import authMiddleware, { type IAuthMiddlewareOptions } from "./authMiddleware"

// Prisma'nın generic delegate imzaları mockImplementation ile uyuşmaz;
// mock'lar düz vi.fn olarak tiplenir.
const findUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>
const create = prisma.user.create as unknown as ReturnType<typeof vi.fn>
const update = prisma.user.update as unknown as ReturnType<typeof vi.fn>

function buildDbUser(overrides: Record<string, unknown> = {}) {
    return {
        id: "db-1",
        cognitoSub: "sub-1",
        email: "user@example.com",
        identifier: "Test User",
        firstName: "Test",
        lastName: "User",
        groups: ["admin"],
        accessStatus: "ACTIVE",
        supplierId: null,
        customerId: null,
        isActive: true,
        ...overrides,
    }
}

function buildEvent(claims?: Record<string, unknown> | null) {
    return {
        requestContext: {
            authorizer: claims === null || claims === undefined
                ? undefined
                : { jwt: { claims } },
        },
    } as any
}

function baseClaims(overrides: Record<string, unknown> = {}) {
    return {
        sub: "sub-1",
        email: "user@example.com",
        ...overrides,
    }
}

async function run(event: any, opts?: IAuthMiddlewareOptions) {
    const { before } = authMiddleware(opts)
    await before({ event } as any)
    return event
}

async function expectHttpError(promise: Promise<unknown>, statusCode: number) {
    try {
        await promise
        expect.unreachable("should have thrown")
    } catch (error) {
        expect((error as HttpError).statusCode).toBe(statusCode)
    }
}

beforeEach(() => {
    vi.clearAllMocks()
    findUnique.mockResolvedValue(buildDbUser() as any)
    create.mockImplementation(async (args: any) => buildDbUser(args.data) as any)
    update.mockImplementation(async (args: any) => buildDbUser(args.data) as any)
})

describe("authMiddleware — auth gates", () => {
    it("throws 401 when claims are missing on a protected route", async () => {
        await expectHttpError(run(buildEvent(null), { requiredPermissionGroups: ["admin"] }), 401)
        await expectHttpError(run(buildEvent(null)), 401)
    })

    it("passes without a user when claims are missing and auth is optional", async () => {
        const event = await run(buildEvent(null), { optional: true })

        expect(event.user).toBeUndefined()
        expect(findUnique).not.toHaveBeenCalled()
    })

    it("throws 401 when sub or email is missing from claims", async () => {
        await expectHttpError(run(buildEvent({ email: "user@example.com" })), 401)
        await expectHttpError(run(buildEvent({ sub: "sub-1" })), 401)
    })
})

describe("authMiddleware — Cognito group parsing (via auto-create)", () => {
    beforeEach(() => {
        findUnique.mockResolvedValue(null as any)
    })

    it("parses the bracketed string format Cognito emits", async () => {
        await run(buildEvent(baseClaims({ "cognito:groups": '["admin"]' })))

        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                groups: ["admin"],
                accessStatus: "ACTIVE",
            }),
        }))
    })

    it("parses comma/space separated strings and array payloads", async () => {
        await run(buildEvent(baseClaims({ "cognito:groups": "admin, sales" })))
        expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
            data: expect.objectContaining({ groups: ["admin", "sales"] }),
        }))

        await run(buildEvent(baseClaims({ "cognito:groups": ["[owner]", "admin"] })))
        expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
            data: expect.objectContaining({ groups: ["owner", "admin"] }),
        }))
    })

    it("drops unknown group names", async () => {
        await run(buildEvent(baseClaims({ "cognito:groups": "admin superuser" })))

        expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
            data: expect.objectContaining({ groups: ["admin"] }),
        }))
    })

    it("defaults to the no-panel user group with PENDING_REVIEW when no groups exist", async () => {
        // Yeni kullanıcı PENDING_REVIEW ile yaratılır ve AYNI istekte 403 alır
        // (allowInactive'siz route) — hesap oluşur ama panele giremez; /hesabim
        // yüzeyine yönlendirme frontend'in işi.
        await expectHttpError(run(buildEvent(baseClaims())), 403)

        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                groups: ["user"],
                accessStatus: "PENDING_REVIEW",
            }),
        }))
    })
})

describe("authMiddleware — user sync and access gates", () => {
    it("does not update a complete existing user and derives flags from DB groups, not claims", async () => {
        // DB'de sales_director; claims admin dese bile DB kaynak-of-truth'tur.
        findUnique.mockResolvedValue(buildDbUser({ groups: ["sales_director"] }) as any)

        const event = await run(buildEvent(baseClaims({ "cognito:groups": '["admin"]' })))

        expect(update).not.toHaveBeenCalled()
        expect(create).not.toHaveBeenCalled()
        expect(event.user.isSalesDirector).toBe(true)
        expect(event.user.isAdmin).toBe(false)
        expect(event.user.isOwner).toBe(false)
        expect(event.user.groups).toEqual(["sales_director"])
    })

    it("backfills missing profile fields from claims", async () => {
        findUnique.mockResolvedValue(buildDbUser({ firstName: null, lastName: null }) as any)

        await run(buildEvent(baseClaims({ given_name: "Ada", family_name: "Lovelace" })))

        expect(update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ firstName: "Ada", lastName: "Lovelace" }),
        }))
    })

    it("throws 403 for a disabled user", async () => {
        findUnique.mockResolvedValue(buildDbUser({ isActive: false }) as any)

        await expectHttpError(run(buildEvent(baseClaims())), 403)
    })

    it("throws 403 for non-ACTIVE access status unless allowInactive is set", async () => {
        findUnique.mockResolvedValue(buildDbUser({ accessStatus: "PENDING_REVIEW", groups: ["user"] }) as any)

        await expectHttpError(run(buildEvent(baseClaims())), 403)

        const event = await run(buildEvent(baseClaims()), { allowInactive: true })
        expect(event.user.accessStatus).toBe("PENDING_REVIEW")
    })
})

describe("authMiddleware — permission groups", () => {
    it("passes on a direct group match", async () => {
        findUnique.mockResolvedValue(buildDbUser({ groups: ["sales"] }) as any)

        const event = await run(buildEvent(baseClaims()), { requiredPermissionGroups: ["sales"] })
        expect(event.user.isSales).toBe(true)
    })

    it("lets higher core roles satisfy lower core requirements (hierarchy)", async () => {
        findUnique.mockResolvedValue(buildDbUser({ groups: ["owner"] }) as any)
        await run(buildEvent(baseClaims()), { requiredPermissionGroups: ["admin"] })

        findUnique.mockResolvedValue(buildDbUser({ groups: ["admin"] }) as any)
        await run(buildEvent(baseClaims()), { requiredPermissionGroups: ["user"] })
    })

    it("rejects lower core roles for higher requirements", async () => {
        findUnique.mockResolvedValue(buildDbUser({ groups: ["user"], accessStatus: "ACTIVE" }) as any)

        await expectHttpError(
            run(buildEvent(baseClaims()), { requiredPermissionGroups: ["admin"] }),
            403,
        )
    })

    it("does NOT extend the hierarchy to non-core groups (documented behavior)", async () => {
        // owner/admin hiyerarşisi yalnız core roller (owner/admin/user) için işler;
        // ["sales"]-only bir route owner'ı bile reddeder. Route'lar bu yüzden
        // gerekli tüm grupları açıkça listeler (ör. ["sales", "admin"]).
        findUnique.mockResolvedValue(buildDbUser({ groups: ["owner"] }) as any)

        await expectHttpError(
            run(buildEvent(baseClaims()), { requiredPermissionGroups: ["sales"] }),
            403,
        )
    })

    it("rejects a user with no matching group at all", async () => {
        findUnique.mockResolvedValue(buildDbUser({ groups: ["customer"] }) as any)

        await expectHttpError(
            run(buildEvent(baseClaims()), { requiredPermissionGroups: ["purchasing"] }),
            403,
        )
    })
})
