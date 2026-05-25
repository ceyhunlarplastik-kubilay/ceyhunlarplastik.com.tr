"use client"

import Link from "next/link"
import { ShoppingCart, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import type { PortalRequestDraftItem } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { formatMoney } from "@/lib/customers/pricing"

type Props = {
    highlighted?: boolean
    items: PortalRequestDraftItem[]
    mode: "order" | "pricing"
    totalQuantity: number
    updateQuantity: (variantId: string, quantity: number) => void
    updateItem: (variantId: string, patch: Partial<PortalRequestDraftItem>) => void
    removeItem: (variantId: string) => void
    clear: () => void
}

export function CustomerPortalRequestDraftPanel({
    highlighted = false,
    items,
    mode,
    totalQuantity,
    updateQuantity,
    updateItem,
    removeItem,
    clear,
}: Props) {
    const isPricing = mode === "pricing"

    function getTargetPriceInputValue(item: PortalRequestDraftItem) {
        if (typeof item.targetUnitPriceInput === "string") return item.targetUnitPriceInput
        if (item.targetUnitPrice === null || item.targetUnitPrice === undefined) return ""
        return String(item.targetUnitPrice)
    }

    return (
        <div className={`space-y-5 rounded-[28px] border bg-white p-6 shadow-sm transition ${highlighted ? "border-brand/60 ring-2 ring-brand/10" : "border-neutral-200"}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Talep Sepeti
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                        {isPricing ? "Fiyat Talebi Kalemleri" : "Sipariş Talebi Kalemleri"}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {isPricing
                            ? "Liste fiyatını görmek, hedef teklif belirtmek ve her kalem için pazarlık notu düşmek için bu alanı kullanın."
                            : "Siparişe dönüştürmek istediğiniz varyantları, miktarlarını ve gerekiyorsa hedef satış fiyatlarını burada düzenleyin."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{items.length} kalem</Badge>
                    <Badge variant="outline">{totalQuantity} adet</Badge>
                    {items.length > 0 ? (
                        <Button type="button" size="sm" variant="ghost" onClick={clear}>
                            Taslağı Temizle
                        </Button>
                    ) : null}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-500">
                    Henüz varyant eklenmedi.{" "}
                    <Link href="/musteri/tum-urunler" className="font-medium text-brand hover:underline">
                        Tüm ürünler
                    </Link>{" "}
                    ekranından ürün modeline ve varyant detayına geçip kalem ekleyebilirsiniz.
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.variantId} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="font-medium text-neutral-900">{item.productName}</div>
                                    <div className="mt-1 text-xs text-neutral-500">{item.variantFullCode}</div>
                                    <div className="mt-1 text-xs text-neutral-500">{item.productCode}</div>
                                </div>

                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeItem(item.variantId)}
                                    aria-label="Kalemi kaldır"
                                >
                                    <Trash2 className="h-4 w-4 text-neutral-500" />
                                </Button>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                                        Miktar
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(event) => updateQuantity(item.variantId, Number(event.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                                        Liste Fiyatı
                                    </div>
                                    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900">
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
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                                        Müşteri Fiyatı
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                                        {formatMoney(item.customerUnitPrice ?? item.listUnitPrice, item.currency ?? "TRY")}
                                        {item.appliedDiscountPercent && item.appliedDiscountPercent > 0 ? (
                                            <div className="mt-1 text-[11px] font-medium text-emerald-700">
                                                %{item.appliedDiscountPercent.toLocaleString("tr-TR", {
                                                    minimumFractionDigits: item.appliedDiscountPercent % 1 === 0 ? 0 : 2,
                                                    maximumFractionDigits: 2,
                                                })} genel iskonto uygulandı
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                                        {isPricing ? "Beklenen Teklif" : "Hedef Birim Fiyat"}
                                    </div>
                                    <InputGroup className="bg-white">
                                        <InputGroupInput
                                            type="text"
                                            inputMode="decimal"
                                            placeholder={isPricing ? "Opsiyonel teklif hedefi" : "Opsiyonel pazarlık fiyatı"}
                                            value={getTargetPriceInputValue(item)}
                                            onChange={(event) => {
                                                const normalized = event.target.value.replace(",", ".")
                                                const trimmed = normalized.trim()
                                                const parsed = trimmed === "" ? null : Number(trimmed)

                                                updateItem(item.variantId, {
                                                    targetUnitPriceInput: normalized,
                                                    targetUnitPrice: parsed !== null && Number.isFinite(parsed) ? parsed : null,
                                                })
                                            }}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>{item.currency ?? "TRY"}</InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                                    {isPricing ? "Pazarlık / Fiyat Notu" : "Kalem Notu"}
                                </div>
                                <Textarea
                                    rows={3}
                                    placeholder={isPricing
                                        ? "Örn. Bu kalem için mevcut sözleşme hacmimize göre revize teklif bekliyoruz."
                                        : "Örn. Bu kalem için alternatif renk / hızlı sevkiyat beklentisi var."}
                                    value={item.customerNote ?? ""}
                                    onChange={(event) => updateItem(item.variantId, {
                                        customerNote: event.target.value,
                                    })}
                                />
                            </div>

                            <div className="mt-3">
                                <Link
                                    href={`/musteri/tum-urunler/urun/${item.productSlug}`}
                                    className="text-xs font-medium text-brand hover:underline"
                                >
                                    Ürün modeline dön
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
