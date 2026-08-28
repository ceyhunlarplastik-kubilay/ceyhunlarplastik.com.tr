"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { CartShortcutKbd } from "@/features/customerPortal/components/CartShortcutKbd"
import { buildCurrencySummary, normalizeDraftQuantity, resolveDraftPreviewImageUrl } from "@/features/customerPortal/components/requestComposer/helpers"
import { useCartDrawerStore } from "@/features/customerPortal/stores/useCartDrawerStore"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { formatMoney } from "@/lib/customers/pricing"

/**
 * Sepetin hızlı gözden geçirme görünümü — sağdan açılan drawer. Detaylı
 * (vade/KDV/pazarlık notu vb.) tam görünüm hâlâ `/musteri/talepler/*` sayfa-
 * larındaki `CustomerPortalRequestDraftPanel`'de; bu bileşen onun yerine
 * geçmiyor, katalogdan çıkmadan hızlı bir "sepetim" bakışı sağlıyor.
 */
export function CustomerPortalCartDrawer() {
    const isOpen = useCartDrawerStore((state) => state.isOpen)
    const setOpen = useCartDrawerStore((state) => state.setOpen)
    const toggle = useCartDrawerStore((state) => state.toggle)
    const items = usePortalRequestDraftStore((state) => state.items)
    const updateQuantity = usePortalRequestDraftStore((state) => state.updateQuantity)
    const removeItem = usePortalRequestDraftStore((state) => state.removeItem)
    const clear = usePortalRequestDraftStore((state) => state.clear)
    const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const currencySummary = useMemo(() => buildCurrencySummary(items), [items])

    // Claude Desktop'ın sidebar kısayolu örnek alındı (Mac: ⌘⌥B). `event.code`
    // kullanılıyor: Mac'te Option basılıyken `event.key` harfi değiştirir
    // (Option+B → "∫"), `code` fiziksel tuşu ("KeyB") her zaman doğru verir.
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.code !== "KeyB") return
            if (!event.altKey) return
            if (!event.metaKey && !event.ctrlKey) return
            event.preventDefault()
            toggle()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggle])

    return (
        <Drawer direction="right" open={isOpen} onOpenChange={setOpen}>
            <DrawerContent className="flex w-full flex-col sm:max-w-md">
                <DrawerHeader>
                    <div className="flex items-center justify-between gap-2">
                        <DrawerTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-brand" />
                            Sepetim
                            <Badge variant="secondary">{items.length} kalem</Badge>
                        </DrawerTitle>
                        <CartShortcutKbd />
                    </div>
                    <DrawerDescription>
                        Sipariş veya fiyat talebine dönüştürmeden önce kalemleri buradan hızlıca gözden geçirin.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 space-y-3 overflow-y-auto px-4">
                    {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                            <p className="text-sm text-neutral-500">Sepetiniz boş.</p>
                            <Button asChild size="sm" className="mt-3">
                                <DrawerClose asChild>
                                    <Link href="/musteri/tum-urunler">Ürünleri İncele</Link>
                                </DrawerClose>
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => {
                            const unitPrice = item.customerUnitPrice ?? item.listUnitPrice
                            const hasDiscount = item.customerUnitPrice != null
                                && item.listUnitPrice != null
                                && item.customerUnitPrice !== item.listUnitPrice

                            return (
                                <div
                                    key={item.variantId}
                                    className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
                                >
                                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                                        <Image
                                            src={brokenImages[item.variantId]
                                                ? "/placeholder.webp"
                                                : resolveDraftPreviewImageUrl(item.productImageUrl)}
                                            alt={item.productName}
                                            fill
                                            sizes="64px"
                                            className="object-contain p-1.5"
                                            onError={() => setBrokenImages((current) => ({ ...current, [item.variantId]: true }))}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="line-clamp-2 text-sm font-semibold text-neutral-950">
                                            {item.productName}
                                        </div>
                                        <div className="text-xs text-neutral-500">{item.variantFullCode}</div>
                                        {item.colorName || item.materialSummary || item.measurementSummary ? (
                                            <div className="flex items-center gap-1 truncate text-[11px] text-neutral-500">
                                                {item.colorName ? (
                                                    <span className="inline-flex shrink-0 items-center gap-1">
                                                        <span
                                                            className="size-2 shrink-0 rounded-full border border-neutral-300"
                                                            style={{ backgroundColor: item.colorHex || "#ddd" }}
                                                        />
                                                        {item.colorName}
                                                    </span>
                                                ) : null}
                                                {item.materialSummary ? (
                                                    <span className="truncate">
                                                        {item.colorName ? "· " : ""}{item.materialSummary}
                                                    </span>
                                                ) : null}
                                                {item.measurementSummary ? (
                                                    <span className="shrink-0">
                                                        {item.colorName || item.materialSummary ? "· " : ""}{item.measurementSummary}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-7"
                                                    aria-label="Adedi azalt"
                                                    onClick={() => updateQuantity(item.variantId, normalizeDraftQuantity(item.quantity - 1))}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={item.quantity}
                                                    onChange={(event) => {
                                                        const parsed = Number(event.target.value.replace(/[^\d]/g, ""))
                                                        if (Number.isFinite(parsed) && parsed > 0) {
                                                            updateQuantity(item.variantId, normalizeDraftQuantity(parsed))
                                                        }
                                                    }}
                                                    className="h-7 w-12 border-0 bg-transparent p-0 text-center text-sm font-medium shadow-none focus-visible:ring-0"
                                                    aria-label="Adet"
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-7"
                                                    aria-label="Adedi artır"
                                                    onClick={() => updateQuantity(item.variantId, normalizeDraftQuantity(item.quantity + 1))}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="size-7 shrink-0"
                                                aria-label="Kalemi kaldır"
                                                onClick={() => removeItem(item.variantId)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-neutral-500" />
                                            </Button>
                                        </div>

                                        <div className="text-sm font-semibold text-neutral-900">
                                            {formatMoney((unitPrice ?? 0) * item.quantity, item.currency ?? "TRY")}
                                            {hasDiscount ? (
                                                <span className="ml-1.5 text-xs font-normal text-neutral-400 line-through">
                                                    {formatMoney((item.listUnitPrice ?? 0) * item.quantity, item.currency ?? "TRY")}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {items.length > 0 ? (
                    <DrawerFooter className="border-t border-neutral-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500">{totalQuantity} adet</span>
                            <span className="font-semibold text-neutral-950">
                                {currencySummary.length === 1
                                    ? formatMoney(currencySummary[0].customerTotal, currencySummary[0].currency)
                                    : currencySummary.map((summary) => `${summary.currency} ${formatMoney(summary.customerTotal, summary.currency)}`).join(" · ")}
                            </span>
                        </div>

                        <Button asChild>
                            <DrawerClose asChild>
                                <Link href="/musteri/talepler/siparis-talebi">Sipariş Talebi Oluştur</Link>
                            </DrawerClose>
                        </Button>
                        <Button asChild variant="outline">
                            <DrawerClose asChild>
                                <Link href="/musteri/talepler/fiyat-talebi">Fiyat Talebi Oluştur</Link>
                            </DrawerClose>
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={clear}>
                            Sepeti Temizle
                        </Button>
                    </DrawerFooter>
                ) : null}
            </DrawerContent>
        </Drawer>
    )
}
