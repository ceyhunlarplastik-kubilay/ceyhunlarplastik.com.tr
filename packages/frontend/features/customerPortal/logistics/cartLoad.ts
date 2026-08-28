import type {
    PortalCartLogisticsProfile,
    PortalCartLogisticsStatus,
} from "@/features/customerPortal/logistics/types"

export const PORTAL_CART_CARRIERS = [
    {
        id: "EURO_PALLET",
        label: "Euro Palet Eşdeğeri",
        compactLabel: "Euro Palet",
        capacityM3: 2.6,
        referenceVolumeM3: null,
        referenceLabel: "EPAL 1 tabanı 1.200 × 800 mm; sabit nominal m³ değeri yok",
        icon: "pallet",
    },
    {
        id: "CONTAINER_20_STD",
        label: "20' Standart Konteyner",
        compactLabel: "20' Konteyner",
        capacityM3: 33,
        referenceVolumeM3: 33.2,
        referenceLabel: "33,2 m³ nominal",
        icon: "container",
    },
    {
        id: "CONTAINER_40_STD",
        label: "40' Standart Konteyner",
        compactLabel: "40' Konteyner",
        capacityM3: 59,
        referenceVolumeM3: 67.7,
        referenceLabel: "67,7 m³ nominal",
        icon: "container",
    },
    {
        id: "CONTAINER_40_HC",
        label: "40' High Cube Konteyner",
        compactLabel: "40' High Cube",
        capacityM3: 69,
        referenceVolumeM3: 76.4,
        referenceLabel: "76,4 m³ nominal",
        icon: "container",
    },
    {
        id: "CURTAIN_TRUCK_13_6",
        label: "13,6 m Tenteli Tır",
        compactLabel: "Tenteli Tır",
        capacityM3: 83,
        referenceVolumeM3: 90.5,
        referenceLabel: "Araç modeline göre yaklaşık 90,5 m³",
        icon: "curtain-sider",
    },
] as const

export type PortalCartCarrier = (typeof PORTAL_CART_CARRIERS)[number]
export type PortalCartCarrierId = PortalCartCarrier["id"]

export type PortalCartLoadItem = {
    variantId: string
    quantity: number
}

export type PortalCartLoadIssue = {
    productVariantId: string
    status: PortalCartLogisticsStatus | "PROFILE_MISSING"
}

export type PortalCarrierLoad = {
    carrier: PortalCartCarrier
    requiredVehicleCount: number
    lastVehicleFillPercent: number
    totalEquivalentFillPercent: number
    overflowVolumeM3: number
    fitsInSingleVehicle: boolean
}

export type PortalCartLoadSummary = {
    itemCount: number
    readyItemCount: number
    totalPackages: number
    totalVolumeM3: number
    knownWeightKg: number
    hasKnownWeight: boolean
    isWeightComplete: boolean
    missingWeightItemCount: number
    issues: PortalCartLoadIssue[]
    isComplete: boolean
    hasKnownVolume: boolean
    carrierLoads: PortalCarrierLoad[]
    automaticLoad: PortalCarrierLoad | null
}

const CAPACITY_EPSILON = 1e-10

export function normalizePortalCartVariantIds(variantIds: readonly string[]): string[] {
    return [...new Set(variantIds)].sort()
}

export function selectPortalCartVariantIds(items: readonly PortalCartLoadItem[]): string[] {
    return normalizePortalCartVariantIds(items.map((item) => item.variantId))
}

function normalizeQuantity(quantity: number): number {
    if (!Number.isFinite(quantity)) return 1
    return Math.max(1, Math.round(quantity))
}

export function resolvePortalCarrierLoad(
    totalVolumeM3: number,
    carrier: PortalCartCarrier,
): PortalCarrierLoad {
    if (!(totalVolumeM3 > 0) || !Number.isFinite(totalVolumeM3)) {
        return {
            carrier,
            requiredVehicleCount: 0,
            lastVehicleFillPercent: 0,
            totalEquivalentFillPercent: 0,
            overflowVolumeM3: 0,
            fitsInSingleVehicle: true,
        }
    }

    const equivalentFill = totalVolumeM3 / carrier.capacityM3
    const requiredVehicleCount = Math.max(1, Math.ceil(equivalentFill - CAPACITY_EPSILON))
    const lastVehicleVolume = totalVolumeM3 - ((requiredVehicleCount - 1) * carrier.capacityM3)
    const lastVehicleFillPercent = Math.min(
        100,
        Math.max(0, (lastVehicleVolume / carrier.capacityM3) * 100),
    )

    return {
        carrier,
        requiredVehicleCount,
        lastVehicleFillPercent,
        totalEquivalentFillPercent: equivalentFill * 100,
        overflowVolumeM3: Math.max(0, totalVolumeM3 - carrier.capacityM3),
        fitsInSingleVehicle: requiredVehicleCount === 1,
    }
}

function resolveAutomaticLoad(carrierLoads: readonly PortalCarrierLoad[]): PortalCarrierLoad | null {
    if (carrierLoads.length === 0 || carrierLoads[0].requiredVehicleCount === 0) return null

    return carrierLoads.find((load) => load.requiredVehicleCount === 1)
        ?? carrierLoads[carrierLoads.length - 1]
}

export function summarizePortalCartLoad(
    items: readonly PortalCartLoadItem[],
    profiles: readonly PortalCartLogisticsProfile[],
): PortalCartLoadSummary {
    const profilesByVariantId = new Map(
        profiles.map((profile) => [profile.productVariantId, profile]),
    )

    let readyItemCount = 0
    let totalPackages = 0
    let totalVolumeM3 = 0
    let knownWeightKg = 0
    let weightedItemCount = 0
    let missingWeightItemCount = 0
    const issues: PortalCartLoadIssue[] = []

    for (const item of items) {
        const profile = profilesByVariantId.get(item.variantId)
        if (!profile) {
            issues.push({ productVariantId: item.variantId, status: "PROFILE_MISSING" })
            continue
        }

        if (profile.status !== "READY" || !profile.logistics) {
            issues.push({ productVariantId: item.variantId, status: profile.status })
            continue
        }

        const packageCount = Math.ceil(
            normalizeQuantity(item.quantity) / profile.logistics.unitsPerPackage,
        )
        readyItemCount += 1
        totalPackages += packageCount
        totalVolumeM3 += packageCount * profile.logistics.packageVolumeM3

        if (profile.logistics.packageWeightKg !== null) {
            weightedItemCount += 1
            knownWeightKg += packageCount * profile.logistics.packageWeightKg
        } else {
            missingWeightItemCount += 1
        }
    }

    const carrierLoads = PORTAL_CART_CARRIERS.map((carrier) =>
        resolvePortalCarrierLoad(totalVolumeM3, carrier),
    )
    const isComplete = items.length > 0 && issues.length === 0

    return {
        itemCount: items.length,
        readyItemCount,
        totalPackages,
        totalVolumeM3,
        knownWeightKg,
        hasKnownWeight: weightedItemCount > 0,
        isWeightComplete: isComplete && missingWeightItemCount === 0,
        missingWeightItemCount,
        issues,
        isComplete,
        hasKnownVolume: readyItemCount > 0,
        carrierLoads,
        // Eksik koli verisinde hacim yalnız alt sınırdır; otomatik "sığar" önerisi yapılmaz.
        automaticLoad: isComplete ? resolveAutomaticLoad(carrierLoads) : null,
    }
}

export function findPortalCarrierLoad(
    summary: PortalCartLoadSummary,
    carrierId: PortalCartCarrierId,
): PortalCarrierLoad {
    return summary.carrierLoads.find((load) => load.carrier.id === carrierId)
        ?? summary.carrierLoads[0]
}
