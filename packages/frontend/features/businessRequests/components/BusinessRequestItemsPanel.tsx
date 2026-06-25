import { Badge } from "@/components/ui/badge"
import type { BusinessRequest } from "@/features/businessRequests/api/types"
import {
    getBusinessRequestItemReference,
    getBusinessRequestItemTitle,
} from "@/features/businessRequests/lib/businessRequestDisplay"
import {
    formatMoneyValue,
    formatPercentValue,
} from "@/features/businessRequests/lib/businessRequestFormatting"
import {
    buildBusinessRequestOrderCurrencySummary,
    getBusinessRequestOrderItemCurrency,
} from "@/features/businessRequests/lib/businessRequestOrderSummary"
import {
    formatCommercialPaymentTerm,
    formatCommercialPriceSource,
    formatCommercialTaxStatus,
} from "@/lib/customers/pricing"

type Props = {
    request: BusinessRequest
}

function isCustomerSpecialPriceRequest(request: BusinessRequest) {
    return request.type === "CUSTOMER_PRICING_REQUEST"
        && request.requestedData?.requestKind === "CUSTOMER_SPECIAL_PRICE_REQUEST"
}

function getNumberValue(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

function getRequestedPriceValue(item: NonNullable<BusinessRequest["items"]>[number], specialPriceRequest: boolean) {
    if (specialPriceRequest) {
        return getNumberValue(item.data?.requestedUnitPrice)
            ?? getNumberValue(item.data?.targetUnitPrice)
    }

    return getNumberValue(item.data?.targetUnitPrice)
}

function formatSpecialPriceItemPaymentTerm(item: NonNullable<BusinessRequest["items"]>[number]) {
    if (typeof item.data?.paymentTermLabel === "string" && item.data.paymentTermLabel.trim()) {
        return item.data.paymentTermLabel
    }

    if (typeof item.data?.paymentTermDays === "number") {
        return item.data.paymentTermDays === 0 ? "Peşin" : `${item.data.paymentTermDays} Gün`
    }

    return "Vade belirtilmedi"
}

export function BusinessRequestItemsPanel({ request }: Props) {
    if ((request.items?.length ?? 0) === 0) return null

    const specialPriceRequest = isCustomerSpecialPriceRequest(request)
    const currencySummary = specialPriceRequest ? [] : buildBusinessRequestOrderCurrencySummary(request.items ?? [])

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-neutral-900">Talep Kalemleri</div>
                {currencySummary.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {currencySummary.map((summary) => (
                            <Badge key={summary.currency} variant="outline" className="bg-neutral-50">
                                {summary.currency}: {summary.hasCustomerTotal
                                    ? formatMoneyValue(summary.customerTotal, summary.currency)
                                    : "Tutar yok"}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className="mt-3 grid gap-3">
                {request.items?.map((item) => {
                    const currency = getBusinessRequestOrderItemCurrency(item)
                    const counterCurrency = typeof item.data?.counterCurrency === "string"
                        ? item.data.counterCurrency
                        : currency
                    const requestedPriceValue = getRequestedPriceValue(item, specialPriceRequest)

                    return (
                        <div key={item.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="font-medium text-neutral-900">
                                        {getBusinessRequestItemTitle(item)}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        {getBusinessRequestItemReference(item)}
                                    </div>
                                </div>
                                <Badge variant="outline">Adet: {item.quantity}</Badge>
                            </div>
                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                                    <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Liste Fiyatı</span>
                                    <div className="mt-1 font-medium text-neutral-900">
                                        {formatMoneyValue(item.data?.listUnitPrice, currency)}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                                    <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                                        {specialPriceRequest ? "Talep Edilen Özel Fiyat" : "Talep Edilen Fiyat"}
                                    </span>
                                    <div className="mt-1 font-medium text-neutral-900">
                                        {formatMoneyValue(requestedPriceValue, currency)}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                                    <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                                        {specialPriceRequest ? "Talep Koşulu" : "Ticari Koşul"}
                                    </span>
                                    <div className="mt-1 font-medium text-neutral-900">
                                        {specialPriceRequest
                                            ? formatSpecialPriceItemPaymentTerm(item)
                                            : formatCommercialPaymentTerm(item.data)}
                                    </div>
                                    <div className="mt-1 text-xs text-neutral-500">
                                        {currency} • {formatCommercialTaxStatus(item.data)} • {specialPriceRequest
                                            ? "Özel fiyat talebi"
                                            : formatCommercialPriceSource(item.data)}
                                    </div>
                                </div>
                                {typeof item.data?.customerUnitPrice === "number" ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 md:col-span-3">
                                        <span className="text-[11px] uppercase tracking-[0.16em] text-emerald-600">Müşteri Net Fiyatı</span>
                                        <div className="mt-1 font-medium">
                                            {formatMoneyValue(item.data?.customerUnitPrice, currency)}
                                        </div>
                                        {item.data?.priceSource === "CUSTOMER_SPECIAL_PRICE" ? (
                                            <div className="mt-1 text-[11px] text-emerald-700">
                                                Özel fiyat snapshot&apos;ı uygulandı
                                            </div>
                                        ) : typeof item.data?.appliedDiscountPercent === "number" && item.data.appliedDiscountPercent > 0 ? (
                                            <div className="mt-1 text-[11px] text-emerald-700">
                                                %{formatPercentValue(item.data.appliedDiscountPercent)} genel iskonto uygulandı
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                                {typeof item.data?.counterUnitPrice === "number" ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                        <span className="text-[11px] uppercase tracking-[0.16em] text-amber-500">Karşı Teklif</span>
                                        <div className="mt-1 font-medium">
                                            {formatMoneyValue(item.data?.counterUnitPrice, counterCurrency)}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            {item.note ? (
                                <div className="mt-2 text-xs text-neutral-600">{item.note}</div>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
