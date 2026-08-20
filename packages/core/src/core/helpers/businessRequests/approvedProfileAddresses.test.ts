import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    customerAddress: { findMany: vi.fn() },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { prepareApprovedBusinessRequestAddresses } from "./service"

/**
 * Adresler transaction AÇILMADAN ÖNCE burada çözülür. Google Places isteği
 * `prisma.$transaction` içinde beklenirse varsayılan 5 sn'lik interaktif
 * transaction süresi ağ gecikmesiyle aşılır (P2028) ve onay geri alınır.
 */
const profileRequest = {
    requesterRole: "CUSTOMER",
    domain: "SALES",
    type: "CUSTOMER_PROFILE_CHANGE",
    customerId: "customer-1",
    requestedData: {
        proposedProfile: {
            addresses: [{
                label: "Merkez",
                city: "İstanbul",
                line1: "Örnek Cadde 1",
                geocodingProvider: "google_places",
                geocodingPlaceId: "place-1",
                latitude: 0,
                longitude: 0,
            }],
        },
    },
} as never

describe("onaylanan profil değişikliğinin adres hazırlığı", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.unstubAllGlobals()
        process.env.GOOGLE_MAPS_SERVER_API_KEY = "server-key"
    })

    it("profil değişikliği olmayan talepte Google'a hiç gitmez", async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)

        const result = await prepareApprovedBusinessRequestAddresses({
            requesterRole: "CUSTOMER",
            domain: "SALES",
            type: "CUSTOMER_ORDER_REQUEST",
            customerId: "customer-1",
            requestedData: {},
        } as never)

        expect(result).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
        expect(prismaMock.customerAddress.findMany).not.toHaveBeenCalled()
    })

    it("place ID'yi sunucuda çözer ve tarayıcı koordinatını kullanmaz", async () => {
        prismaMock.customerAddress.findMany.mockResolvedValue([])
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            id: "place-1",
            location: { latitude: 41.0082, longitude: 28.9784 },
        }), { status: 200 }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await prepareApprovedBusinessRequestAddresses(profileRequest, {
            approvedByUserId: "user-1",
        })

        expect(fetchMock).toHaveBeenCalledOnce()
        expect(result).toMatchObject([{
            label: "Merkez",
            latitude: 41.0082,
            longitude: 28.9784,
            geocodingProvider: "google_places",
            geocodingPlaceId: "place-1",
        }])
    })

    it("kayıtlı adres aynı place ID için hâlâ tazeyse Google'a gitmez", async () => {
        prismaMock.customerAddress.findMany.mockResolvedValue([{
            geocodingProvider: "google_places",
            geocodingPlaceId: "place-1",
            geocodingExpiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            latitude: "41.0082",
            longitude: "28.9784",
        }])
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)

        const result = await prepareApprovedBusinessRequestAddresses(profileRequest, {
            approvedByUserId: "user-1",
        })

        expect(fetchMock).not.toHaveBeenCalled()
        expect(result).toMatchObject([{ latitude: 41.0082, longitude: 28.9784 }])
    })
})
