import type { CustomerMapCustomerGroup, CustomerMapPoint } from "@/features/customerLocations/types"

/**
 * Harita ucu (`/sales/customers/map`) müşteri başına değil ADRES başına satır
 * döner — aynı müşterinin 2 adresi varsa 2 ayrı `CustomerMapPoint` gelir. Liste
 * görünümü müşteri başına tek satır gösterdiği için `customerId`'ye göre gruplar.
 */
export function groupCustomerMapPoints(points: CustomerMapPoint[]): CustomerMapCustomerGroup[] {
    const groups = new Map<string, CustomerMapCustomerGroup>()

    for (const point of points) {
        const existing = groups.get(point.customerId)

        const address = {
            addressId: point.addressId,
            addressLabel: point.addressLabel,
            addressSummary: point.addressSummary,
            latitude: point.latitude,
            longitude: point.longitude,
            isPrimary: point.isPrimary,
            isShipping: point.isShipping,
            geocodingProvider: point.geocodingProvider,
            geocodingPlaceId: point.geocodingPlaceId,
        }

        if (existing) {
            existing.addresses.push(address)
            continue
        }

        groups.set(point.customerId, {
            customerId: point.customerId,
            companyName: point.companyName,
            fullName: point.fullName,
            email: point.email,
            phone: point.phone,
            status: point.status,
            assignedSalesUserId: point.assignedSalesUserId,
            addresses: [address],
        })
    }

    return [...groups.values()]
}
