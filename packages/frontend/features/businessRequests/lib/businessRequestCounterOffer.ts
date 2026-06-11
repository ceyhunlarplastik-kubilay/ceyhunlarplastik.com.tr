import type {
    BusinessRequest,
    BusinessRequestCounterOfferItemInput,
    BusinessRequestItem,
} from "@/features/businessRequests/api/types"

export function getCounterOfferInputPlaceholder(item: BusinessRequestItem) {
    if (typeof item.data?.counterUnitPrice === "number") {
        return String(item.data.counterUnitPrice)
    }

    if (typeof item.data?.targetUnitPrice === "number") {
        return String(item.data.targetUnitPrice)
    }

    return "0"
}

export function buildCounterOfferItems(
    request: BusinessRequest,
    counterValues: Record<string, string>,
): BusinessRequestCounterOfferItemInput[] {
    return (request.items ?? [])
        .map((item) => ({
            rawValue: counterValues[item.id]?.trim()
                || (typeof item.data?.counterUnitPrice === "number"
                    ? String(item.data.counterUnitPrice)
                    : typeof item.data?.targetUnitPrice === "number"
                        ? String(item.data.targetUnitPrice)
                        : ""),
            requestItemId: item.id,
            proposedUnitPrice: 0,
            currency: typeof item.data?.currency === "string" ? item.data.currency : "TRY",
        }))
        .map((item) => ({
            requestItemId: item.requestItemId,
            proposedUnitPrice: Number.parseFloat(item.rawValue.replace(",", ".")),
            currency: item.currency,
        }))
        .filter((item) => Number.isFinite(item.proposedUnitPrice) && item.proposedUnitPrice > 0)
}
