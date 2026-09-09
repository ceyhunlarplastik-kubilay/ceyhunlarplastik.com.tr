import { describe, expect, it } from "vitest"
import { groupCustomerMapPoints } from "@/features/customerLocations/lib/groupCustomerMapPoints"
import type { CustomerMapPoint } from "@/features/customerLocations/types"

function buildPoint(overrides: Partial<CustomerMapPoint>): CustomerMapPoint {
    return {
        customerId: "cust-1",
        companyName: "Acme A.Ş.",
        fullName: "Ayşe Yılmaz",
        email: "ayse@acme.test",
        phone: "5551112233",
        status: "CUSTOMER",
        assignedSalesUserId: "user-1",
        addressId: "addr-1",
        addressLabel: "Merkez",
        addressSummary: "İzmir, Bornova",
        latitude: 38.4,
        longitude: 27.1,
        isPrimary: true,
        isShipping: false,
        geocodingProvider: "google_places",
        geocodingPlaceId: "place-1",
        ...overrides,
    }
}

describe("groupCustomerMapPoints", () => {
    it("aynı müşterinin birden fazla adresini tek grupta birleştirir", () => {
        const points = [
            buildPoint({ addressId: "addr-1", addressLabel: "Merkez" }),
            buildPoint({ addressId: "addr-2", addressLabel: "Depo", isPrimary: false, isShipping: true }),
        ]

        const groups = groupCustomerMapPoints(points)

        expect(groups).toHaveLength(1)
        expect(groups[0].customerId).toBe("cust-1")
        expect(groups[0].addresses).toHaveLength(2)
        expect(groups[0].addresses.map((address) => address.addressId)).toEqual(["addr-1", "addr-2"])
    })

    it("farklı müşterileri ayrı gruplara koyar ve ilk görülme sırasını korur", () => {
        const points = [
            buildPoint({ customerId: "cust-2", addressId: "addr-3", fullName: "Mehmet Demir" }),
            buildPoint({ customerId: "cust-1", addressId: "addr-1" }),
        ]

        const groups = groupCustomerMapPoints(points)

        expect(groups.map((group) => group.customerId)).toEqual(["cust-2", "cust-1"])
        expect(groups[0].fullName).toBe("Mehmet Demir")
    })

    it("boş liste için boş dizi döner", () => {
        expect(groupCustomerMapPoints([])).toEqual([])
    })
})
