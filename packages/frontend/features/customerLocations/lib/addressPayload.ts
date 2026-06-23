import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"

export function normalizeOptionalString(value?: string | null) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

export function normalizeAddressPayload(input: AddressDraftFormValues) {
    return {
        label: input.label.trim(),
        contactName: normalizeOptionalString(input.contactName),
        phone: normalizeOptionalString(input.phone),
        email: normalizeOptionalString(input.email),
        countryId: input.countryId ?? null,
        stateId: input.stateId ?? null,
        cityId: input.cityId ?? null,
        country: normalizeOptionalString(input.country) || "Turkiye",
        stateName: normalizeOptionalString(input.stateName),
        city: input.city.trim(),
        district: normalizeOptionalString(input.district),
        line1: input.line1.trim(),
        line2: normalizeOptionalString(input.line2),
        postalCode: normalizeOptionalString(input.postalCode),
        taxOffice: normalizeOptionalString(input.taxOffice),
        taxNumber: normalizeOptionalString(input.taxNumber),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        locationSource: input.locationSource ?? null,
        locationAccuracy: input.locationAccuracy ?? null,
        geocodingProvider: normalizeOptionalString(input.geocodingProvider),
        geocodingPlaceId: normalizeOptionalString(input.geocodingPlaceId),
        geocodingLabel: normalizeOptionalString(input.geocodingLabel),
        geocodingRaw: input.geocodingRaw ?? null,
        geocodedAt: normalizeOptionalString(input.geocodedAt),
        isPrimary: input.isPrimary,
        isBilling: input.isBilling,
        isShipping: input.isShipping,
        note: normalizeOptionalString(input.note),
    }
}

