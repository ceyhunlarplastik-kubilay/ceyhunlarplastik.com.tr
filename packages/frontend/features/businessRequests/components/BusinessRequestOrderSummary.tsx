import { Badge } from "@/components/ui/badge"
import type { BusinessRequest } from "@/features/businessRequests/api/types"
import {
    formatDateValue,
    formatMoneyValue,
} from "@/features/businessRequests/lib/businessRequestFormatting"
import {
    formatBusinessRequestOrderQuantity,
    getBusinessRequestOrderSummary,
    type BusinessRequestCommercialTermGroup,
} from "@/features/businessRequests/lib/businessRequestOrderSummary"
import { cn } from "@/lib/utils"

type Props = {
    request: BusinessRequest
    className?: string
}

function formatCommercialTermGroupLabel(group: BusinessRequestCommercialTermGroup) {
    return `${group.paymentTermLabel} • ${group.currency} • ${group.taxStatus} • ${group.priceSource}`
}

export function BusinessRequestOrderSummary({
    request,
    className,
}: Props) {
    const summary = getBusinessRequestOrderSummary(request)

    if (!summary) return null

    const visibleCommercialTermGroups = summary.commercialTermGroups.slice(0, 3)
    const hiddenCommercialTermGroupCount = summary.commercialTermGroups.length - visibleCommercialTermGroups.length

    return (
        <div className={cn("mt-2 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2", className)}>
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    Sepet
                </span>
                <span className="text-xs text-neutral-600">
                    {summary.itemCount} kalem / {formatBusinessRequestOrderQuantity(summary.totalQuantity)} adet
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {summary.currencySummary.map((currencySummary) => (
                    <Badge key={currencySummary.currency} variant="outline" className="bg-white text-neutral-700">
                        {currencySummary.currency}: {currencySummary.hasCustomerTotal
                            ? formatMoneyValue(currencySummary.customerTotal, currencySummary.currency)
                            : "Tutar yok"}
                    </Badge>
                ))}
            </div>

            <div className="space-y-1 text-xs text-neutral-600">
                <div>
                    Vade: <span className="font-medium text-neutral-800">
                        {summary.hasMixedPaymentTerms
                            ? "Kalem bazında değişiyor"
                            : summary.paymentTermLabels[0] ?? "Vade tanımlı değil"}
                    </span>
                </div>
                <div>
                    Koşul: <span className="font-medium text-neutral-800">
                        {summary.hasMixedCommercialTerms
                            ? `${summary.commercialTermGroups.length} farklı koşul`
                            : summary.commercialTermGroups[0]
                                ? `${summary.commercialTermGroups[0].currency} • ${summary.commercialTermGroups[0].taxStatus} • ${summary.commercialTermGroups[0].priceSource}`
                                : "Koşul tanımlı değil"}
                    </span>
                </div>

                {summary.hasMixedCommercialTerms ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {visibleCommercialTermGroups.map((group) => (
                            <span
                                key={group.key}
                                className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-600"
                            >
                                {formatCommercialTermGroupLabel(group)}
                            </span>
                        ))}
                        {hiddenCommercialTermGroupCount > 0 ? (
                            <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-600">
                                +{hiddenCommercialTermGroupCount} koşul
                            </span>
                        ) : null}
                    </div>
                ) : null}

                {summary.shippingAddressLabel || summary.requestedDeliveryDate || summary.referenceCode ? (
                    <div className="text-neutral-500">
                        {summary.shippingAddressLabel ? `Sevkiyat: ${summary.shippingAddressLabel}` : null}
                        {summary.shippingAddressLabel && summary.requestedDeliveryDate ? " • " : null}
                        {summary.requestedDeliveryDate ? `Termin: ${formatDateValue(summary.requestedDeliveryDate)}` : null}
                        {(summary.shippingAddressLabel || summary.requestedDeliveryDate) && summary.referenceCode ? " • " : null}
                        {summary.referenceCode ? `Ref: ${summary.referenceCode}` : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
