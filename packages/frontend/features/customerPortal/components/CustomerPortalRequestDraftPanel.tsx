"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Clock3, MapPin, ShoppingCart, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { buildCurrencySummary, normalizeDraftQuantity, resolveDraftPreviewImageUrl } from "@/features/customerPortal/components/requestComposer/helpers"
import type { PortalRequestDraftItem } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { formatMoney, formatPaymentTermLabel } from "@/lib/customers/pricing"

import { MessageSquareText } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Props = {
    id?: string
    highlighted?: boolean
    items: PortalRequestDraftItem[]
    mode: "order" | "pricing"
    totalQuantity: number
    orderSummary?: {
        requestedDeliveryDate?: string | null
        shippingAddressLabel?: string | null
        shippingAddressSummary?: string | null
        paymentTermDays?: number | null
        paymentTermNote?: string | null
    }
    updateQuantity: (variantId: string, quantity: number) => void
    updateItem: (variantId: string, patch: Partial<PortalRequestDraftItem>) => void
    removeItem: (variantId: string) => void
    clear: () => void
}

export function CustomerPortalRequestDraftPanel({
    id,
    highlighted = false,
    items,
    mode,
    totalQuantity,
    orderSummary,
    updateQuantity,
    updateItem,
    removeItem,
    clear,
}: Props) {
    const isPricing = mode === "pricing"
    const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({})
    const [brokenVariantImages, setBrokenVariantImages] = useState<Record<string, boolean>>({})
    const currencySummary = useMemo(() => buildCurrencySummary(items), [items])

    useEffect(() => {
        setQuantityInputs((current) => {
            const next: Record<string, string> = {}
            items.forEach((item) => {
                next[item.variantId] = current[item.variantId] ?? String(item.quantity)
            })
            return next
        })
    }, [items])

    function handleQuantityCommit(variantId: string) {
        const normalized = normalizeDraftQuantity(Number(quantityInputs[variantId] ?? ""))
        updateQuantity(variantId, normalized)
        setQuantityInputs((current) => ({
            ...current,
            [variantId]: String(normalized),
        }))
    }

    return (
        <div
            id={id}
            tabIndex={-1}
            className={`space-y-5 rounded-[28px] border bg-white p-6 shadow-sm transition outline-none ${highlighted ? "border-brand/60 ring-2 ring-brand/10" : "border-neutral-200"}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {isPricing ? "Fiyat Talebi Sepeti" : "Sipariş Talep Sepeti"}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                        {isPricing ? "Fiyat Talep Edilen Ürünler" : "Sipariş Talep Edilen Ürünler"}
                    </h3>
                    {/* <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {isPricing
                            ? "Liste fiyatini, hedef teklifinizi ve pazarlik notlarinizi kalem bazinda yonetin."
                            : "Siparise donusecek varyantlari, miktarlari ve ticari beklentileri onizleme uzerinden duzenleyin."}
                    </p> */}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{items.length} kalem</Badge>
                    <Badge variant="outline">{totalQuantity} adet</Badge>
                    {items.length > 0 ? (
                        <Button type="button" size="sm" variant="ghost" onClick={clear}>
                            Sepeti Temizle
                        </Button>
                    ) : null}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-brand/[0.04] p-6">
                    <div className="max-w-2xl space-y-3">
                        <h4 className="text-base font-semibold text-neutral-950">Sepetiniz boş</h4>
                        <p className="text-sm leading-6 text-neutral-500">
                            Varyant detay ekranlarından ürün eklediğinizde sipariş veya fiyat talebinizi burada son kez gözden geçirip onaya gönderebilirsiniz.
                        </p>
                        <Button asChild>
                            <Link href="/musteri/tum-urunler">Ürünleri İncele</Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-50">
                        <Table className="min-w-[1120px]">
                            <TableHeader className="bg-white/90">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[340px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Ürün</TableHead>
                                    <TableHead className="w-[110px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Miktar</TableHead>
                                    <TableHead className="w-[170px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Liste Fiyatı</TableHead>
                                    <TableHead className="w-[190px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Müşteri Fiyatı</TableHead>
                                    <TableHead className="w-[180px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Ara Toplam</TableHead>
                                    <TableHead className="w-[180px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{isPricing ? "Pazarlık Notu" : "Not"}</TableHead>
                                    <TableHead className="w-[88px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.variantId} className="bg-transparent align-middle">
                                        <TableCell className="px-4 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                                                    <Image
                                                        src={brokenVariantImages[item.variantId]
                                                            ? "/placeholder.webp"
                                                            : resolveDraftPreviewImageUrl(item.productImageUrl)}
                                                        alt={item.productName}
                                                        fill
                                                        sizes="80px"
                                                        className="object-contain p-2"
                                                        onError={() => {
                                                            setBrokenVariantImages((current) => ({
                                                                ...current,
                                                                [item.variantId]: true,
                                                            }))
                                                        }}
                                                    />
                                                </div>
                                                <div className="min-w-0 space-y-1 self-center">
                                                    <div className="line-clamp-2 text-sm font-semibold text-neutral-950">
                                                        {item.productName}
                                                    </div>
                                                    <div className="text-xs font-medium text-neutral-500">
                                                        {item.variantFullCode}
                                                    </div>
                                                    <div className="text-xs text-neutral-400">
                                                        {item.productCode}
                                                    </div>
                                                    <Link
                                                        href={`/musteri/tum-urunler/urun/${item.productSlug}`}
                                                        className="inline-flex pt-1 text-xs font-medium text-brand hover:underline"
                                                    >
                                                        Urun modeline don
                                                    </Link>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 align-middle">
                                            <div className="flex min-h-[92px] items-center">
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={quantityInputs[item.variantId] ?? String(item.quantity)}
                                                    onChange={(event) => {
                                                        const cleaned = event.target.value.replace(/[^\d]/g, "")
                                                        setQuantityInputs((current) => ({
                                                            ...current,
                                                            [item.variantId]: cleaned,
                                                        }))
                                                        if (cleaned === "") return
                                                        const parsed = Number(cleaned)
                                                        if (Number.isFinite(parsed) && parsed > 0) {
                                                            updateQuantity(item.variantId, normalizeDraftQuantity(parsed))
                                                        }
                                                    }}
                                                    onBlur={() => handleQuantityCommit(item.variantId)}
                                                    className="h-11 w-[92px] rounded-xl bg-white text-center text-sm font-semibold"
                                                />
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 align-middle">
                                            <div className="flex min-h-[76px] flex-col justify-center rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-900">
                                                {item.customerUnitPrice !== null
                                                    && item.customerUnitPrice !== undefined
                                                    && item.appliedDiscountPercent
                                                    && item.appliedDiscountPercent > 0 ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-neutral-400 line-through">
                                                            {formatMoney(item.listUnitPrice, item.currency ?? "TRY")}
                                                        </div>
                                                        <div>{formatMoney(item.customerUnitPrice, item.currency ?? "TRY")}</div>
                                                    </div>
                                                ) : (
                                                    formatMoney(item.listUnitPrice, item.currency ?? "TRY")
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 align-middle">
                                            <div className="flex min-h-[76px] flex-col justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-900">
                                                <div>{formatMoney(item.customerUnitPrice ?? item.listUnitPrice, item.currency ?? "TRY")}</div>
                                                {item.appliedDiscountPercent && item.appliedDiscountPercent > 0 ? (
                                                    <div className="mt-1 text-[11px] font-medium text-emerald-700">
                                                        %{item.appliedDiscountPercent.toLocaleString("tr-TR", {
                                                            minimumFractionDigits: item.appliedDiscountPercent % 1 === 0 ? 0 : 2,
                                                            maximumFractionDigits: 2,
                                                        })} genel iskonto
                                                    </div>
                                                ) : null}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 align-middle">
                                            <div className="flex min-h-[76px] flex-col justify-center rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-semibold text-neutral-950">
                                                {item.customerUnitPrice !== null
                                                    && item.customerUnitPrice !== undefined
                                                    && item.appliedDiscountPercent
                                                    && item.appliedDiscountPercent > 0
                                                    && item.listUnitPrice !== null
                                                    && item.listUnitPrice !== undefined ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-neutral-400 line-through">
                                                            {formatMoney(item.listUnitPrice * item.quantity, item.currency ?? "TRY")}
                                                        </div>
                                                        <div>{formatMoney(item.customerUnitPrice * item.quantity, item.currency ?? "TRY")}</div>
                                                    </div>
                                                ) : (
                                                    formatMoney((item.customerUnitPrice ?? item.listUnitPrice ?? 0) * item.quantity, item.currency ?? "TRY")
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 align-middle">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="group flex w-[150px] items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                                                    >
                                                        <MessageSquareText className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-neutral-700" />
                                                        <span className="min-w-0 flex-1 truncate text-neutral-600">
                                                            {item.customerNote?.trim() || "Not ekle"}
                                                        </span>
                                                    </button>
                                                </PopoverTrigger>

                                                <PopoverContent align="end" className="w-80 rounded-2xl p-4">
                                                    <div className="space-y-3">
                                                        <div className="text-sm font-semibold text-neutral-950">
                                                            {isPricing ? "Pazarlık Notu" : "Kalem Notu"}
                                                        </div>

                                                        <Textarea
                                                            rows={5}
                                                            placeholder={isPricing
                                                                ? "Örn. Bu kalem için mevcut sözleşme hacmine göre revize teklif bekliyoruz."
                                                                : "Örn. Bu kalem için alternatif renk veya hızlı sevkiyat beklentisi var."}
                                                            value={item.customerNote ?? ""}
                                                            onChange={(event) => updateItem(item.variantId, {
                                                                customerNote: event.target.value,
                                                            })}
                                                            className="resize-none rounded-xl text-sm leading-6"
                                                        />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 text-right align-middle">
                                            <div className="flex min-h-[92px] items-center justify-end">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeItem(item.variantId)}
                                                    aria-label="Kalemi kaldir"
                                                    className="size-10 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4 text-neutral-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className={`grid gap-4 ${!isPricing ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)_320px]"}`}>
                        {!isPricing ? (
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                        <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                            <MapPin className="h-4 w-4" />
                                            Sevkiyat Ozeti
                                        </div>
                                        <div className="mt-3 text-sm text-neutral-600">
                                            <div className="font-medium text-neutral-900">
                                                {orderSummary?.shippingAddressLabel || "Henuz sevkiyat adresi secilmedi"}
                                            </div>
                                            {orderSummary?.shippingAddressSummary ? (
                                                <div className="mt-1 leading-6">{orderSummary.shippingAddressSummary}</div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                        <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                            <Clock3 className="h-4 w-4" />
                                            Vade ve Termin
                                        </div>
                                        <div className="mt-3 space-y-1 text-sm text-neutral-600">
                                            <div>{formatPaymentTermLabel(orderSummary?.paymentTermDays) || "Vade bilgisi tanimli degil"}</div>
                                            {orderSummary?.paymentTermNote ? (
                                                <div className="leading-6">{orderSummary.paymentTermNote}</div>
                                            ) : null}
                                            {orderSummary?.requestedDeliveryDate ? (
                                                <div>
                                                    Talep termin: {new Intl.DateTimeFormat("tr-TR", {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    }).format(new Date(orderSummary.requestedDeliveryDate))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] p-4">
                            <div className="text-sm font-semibold text-neutral-950">
                                {isPricing ? "Teklif Ozeti" : "Siparis Ozeti"}
                            </div>
                            <div className="mt-4 space-y-3 text-sm text-neutral-700">
                                <div className="flex items-center justify-between gap-3">
                                    <span>Toplam kalem</span>
                                    <span className="font-medium text-neutral-950">{items.length}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span>Toplam adet</span>
                                    <span className="font-medium text-neutral-950">{totalQuantity}</span>
                                </div>

                                {currencySummary.length === 1 ? (
                                    <>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Liste toplami</span>
                                            <span className="font-medium text-neutral-950">
                                                {formatMoney(currencySummary[0].listTotal, currencySummary[0].currency)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Musteri toplami</span>
                                            <span className="text-base font-semibold text-brand">
                                                {formatMoney(currencySummary[0].customerTotal, currencySummary[0].currency)}
                                            </span>
                                        </div>
                                        {currencySummary[0].listTotal > currencySummary[0].customerTotal ? (
                                            <div className="rounded-xl bg-emerald-100/70 px-3 py-2 text-xs font-medium text-emerald-800">
                                                Iskonto etkisi: {formatMoney(currencySummary[0].listTotal - currencySummary[0].customerTotal, currencySummary[0].currency)}
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                                            Sepette birden fazla para birimi var. Toplamlar para birimine gore ayrildi.
                                        </div>
                                        {currencySummary.map((summary) => (
                                            <div key={summary.currency} className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
                                                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-neutral-400">
                                                    <span>{summary.currency}</span>
                                                    <span>Ayrik toplam</span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                                    <span>Liste</span>
                                                    <span className="font-medium text-neutral-950">
                                                        {formatMoney(summary.listTotal, summary.currency)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                                                    <span>Musteri</span>
                                                    <span className="font-semibold text-brand">
                                                        {formatMoney(summary.customerTotal, summary.currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
