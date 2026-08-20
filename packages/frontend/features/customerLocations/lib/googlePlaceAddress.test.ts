import { describe, expect, it } from "vitest"
import {
    matchGeoCountry,
    matchGeoOption,
    normalizeGeoName,
    parseGooglePlaceAddress,
    type GoogleAddressComponentLike,
} from "@/features/customerLocations/lib/googlePlaceAddress"

function component(
    longText: string,
    shortText: string,
    ...types: string[]
): GoogleAddressComponentLike {
    return { longText, shortText, types }
}

describe("parseGooglePlaceAddress", () => {
    it("Türkiye adresini CRM taslağına ayırır", () => {
        const result = parseGooglePlaceAddress([
            component("Türkiye", "TR", "country", "political"),
            component("İzmir", "İzmir", "administrative_area_level_1", "political"),
            component("Gaziemir", "Gaziemir", "administrative_area_level_2", "political"),
            component("Zafer", "Zafer", "neighborhood", "political"),
            component("Kürşad Sokak", "Kürşad Sk.", "route"),
            component("12", "12", "street_number"),
            component("35411", "35411", "postal_code"),
        ])

        expect(result).toEqual({
            countryCode: "TR",
            countryName: "Türkiye",
            stateName: "İzmir",
            cityName: "Gaziemir",
            district: "Zafer",
            line1: "Kürşad Sokak 12",
            postalCode: "35411",
        })
    })

    it("eksik bileşenlerde yalnız mevcut alanları döndürür", () => {
        expect(parseGooglePlaceAddress([
            component("Türkiye", "TR", "country"),
            component("Ankara", "Ankara", "administrative_area_level_1"),
        ])).toEqual({
            countryCode: "TR",
            countryName: "Türkiye",
            stateName: "Ankara",
            cityName: undefined,
            district: undefined,
            line1: undefined,
            postalCode: undefined,
        })
    })

    it("Türkiye dışında ilçe idari bölgesi yerine şehri önceliklendirir", () => {
        const result = parseGooglePlaceAddress([
            component("United States", "US", "country"),
            component("California", "CA", "administrative_area_level_1"),
            component("Los Angeles County", "Los Angeles County", "administrative_area_level_2"),
            component("Los Angeles", "Los Angeles", "locality"),
        ])

        expect(result.cityName).toBe("Los Angeles")
    })

    it("işletme sonucunda tam adresi Açık Adres alanında önceliklendirir", () => {
        const result = parseGooglePlaceAddress([
            component("Kürşad Sokak", "Kürşad Sk.", "route"),
            component("35411", "35411", "postal_code"),
        ], "Ege Serbest Bölgesi, Kürşad Sokak, Zafer SB, 35411 Gaziemir/İzmir, Türkiye")

        expect(result.line1).toBe(
            "Ege Serbest Bölgesi, Kürşad Sokak, Zafer SB, 35411 Gaziemir/İzmir, Türkiye",
        )
    })

    it("üçüncü seviye idari alanı Mahalle / Bölge olarak kullanır", () => {
        const result = parseGooglePlaceAddress([
            component("Zafer Serbest Bölge", "Zafer SB", "administrative_area_level_3"),
        ])

        expect(result.district).toBe("Zafer Serbest Bölge")
    })
})

describe("geo referans eşleştirme", () => {
    it("ülkeyi ISO2 koduyla bulur", () => {
        expect(matchGeoCountry([
            { id: 225, name: "Türkiye", iso2: "TR" },
        ], { countryCode: "tr", countryName: "Turkey" })?.id).toBe(225)
    })

    it("Türkçe karakter ve idari ekleri normalize eder", () => {
        expect(normalizeGeoName("İzmir İli")).toBe("izmir")
        expect(matchGeoOption([
            { id: 351, name: "Şişli" },
        ], "Şişli İlçesi")?.id).toBe(351)
    })
})
