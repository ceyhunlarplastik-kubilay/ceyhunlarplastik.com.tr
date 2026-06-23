import type { CustomerAddress } from "@/features/admin/customers/api/types"
import {
    emptyAddress,
    type AddressDraftFormValues,
} from "@/features/customerPortal/components/requestComposer/schema"

export function toAddressDraftValues(address?: CustomerAddress | null): AddressDraftFormValues {
    const base = emptyAddress()
    if (!address) return base

    return {
        ...base,
        label: address.label,
        contactName: address.contactName ?? "",
        phone: address.phone ?? "",
        email: address.email ?? "",
        countryId: address.countryId ?? null,
        stateId: address.stateId ?? null,
        cityId: address.cityId ?? null,
        country: address.country,
        stateName: address.stateRef?.name ?? "",
        city: address.city,
        district: address.district ?? "",
        line1: address.line1,
        line2: address.line2 ?? "",
        postalCode: address.postalCode ?? "",
        taxOffice: address.taxOffice ?? "",
        taxNumber: address.taxNumber ?? "",
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null,
        locationSource: address.locationSource ?? null,
        locationAccuracy: address.locationAccuracy ?? null,
        geocodingProvider: address.geocodingProvider ?? "",
        geocodingPlaceId: address.geocodingPlaceId ?? "",
        geocodingLabel: address.geocodingLabel ?? "",
        geocodingRaw: address.geocodingRaw,
        geocodedAt: address.geocodedAt ?? "",
        isPrimary: address.isPrimary,
        isBilling: address.isBilling,
        isShipping: address.isShipping,
        note: address.note ?? "",
    }
}

