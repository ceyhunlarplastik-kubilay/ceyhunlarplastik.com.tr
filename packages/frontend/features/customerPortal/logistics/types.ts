import type { ApiEnvelope } from "@/lib/http/types"

export const PORTAL_CART_LOGISTICS_STATUS = [
    "READY",
    "NOT_FOUND",
    "NO_ACTIVE_SUPPLIER",
    "AMBIGUOUS_ACTIVE_SUPPLIER",
    "INCOMPLETE_PACKAGE_DATA",
] as const

export type PortalCartLogisticsStatus = (typeof PORTAL_CART_LOGISTICS_STATUS)[number]

export type PortalCartPackageLogistics = {
    unitsPerPackage: number
    packageVolumeM3: number
    packageWeightKg: number | null
}

export type PortalCartLogisticsProfile = {
    productVariantId: string
    status: PortalCartLogisticsStatus
    logistics: PortalCartPackageLogistics | null
}

export type PortalCartLogisticsPayload = {
    profiles: PortalCartLogisticsProfile[]
}

export type PortalCartLogisticsResponse = ApiEnvelope<PortalCartLogisticsPayload>
