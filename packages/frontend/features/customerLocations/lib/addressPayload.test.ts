import { describe, expect, it } from "vitest"
import { normalizeAddressPayload } from "@/features/customerLocations/lib/addressPayload"
import {
    addressDraftSchema,
    emptyAddress,
} from "@/features/customerPortal/components/requestComposer/schema"

describe("adres e-posta alanı", () => {
    it("boş e-postayı geçerli ve API için null kabul eder", () => {
        const address = {
            ...emptyAddress(),
            label: "Merkez",
            email: "",
            countryId: 1,
            stateId: 2,
            cityId: 3,
            city: "Gaziemir",
            line1: "Kürşad Sokak",
        }

        expect(addressDraftSchema.safeParse(address).success).toBe(true)
        expect(normalizeAddressPayload(address).email).toBeNull()
    })

    it("doluysa geçerli bir e-posta ister", () => {
        expect(addressDraftSchema.safeParse({
            ...emptyAddress(),
            email: "gecersiz-adres",
        }).success).toBe(false)
    })
})
