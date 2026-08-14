"use client"

import { useMemo, useState } from "react"
import { Check, PackageSearch, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import { useProductVariantTable } from "@/features/public/products/hooks/useProductVariantTable"
import { cn } from "@/lib/utils"

export type PickedVariant = {
    productVariantId: string
    fullCode: string
    productName: string
    discountPercent: number | null
}

type Props = {
    value: PickedVariant[]
    onChange: (next: PickedVariant[]) => void
}

/**
 * Ürün seç → varyantlarını işaretle. Seçim ürün değiştikçe korunur, çünkü bir
 * kampanya birden çok ürünün varyantlarını kapsayabilir.
 */
export function CampaignVariantPicker({ value, onChange }: Props) {
    const [search, setSearch] = useState("")
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

    const productsQuery = useProducts({ page: 1, limit: 50, search: search || undefined, view: "card" })
    const products = productsQuery.data?.data ?? []
    const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null

    const variantsQuery = useProductVariantTable(selectedProductId ?? "")
    const variants = variantsQuery.data ?? []

    const selectedIds = useMemo(
        () => new Set(value.map((item) => item.productVariantId)),
        [value],
    )

    const toggleVariant = (variantId: string, fullCode: string) => {
        if (selectedIds.has(variantId)) {
            onChange(value.filter((item) => item.productVariantId !== variantId))
            return
        }

        onChange([
            ...value,
            {
                productVariantId: variantId,
                fullCode,
                productName: selectedProduct?.name ?? "",
                discountPercent: null,
            },
        ])
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Ürün ara"
                        className="pl-9"
                    />
                </div>

                <ScrollArea className="h-70 rounded-2xl border border-neutral-200">
                    {productsQuery.isLoading ? (
                        <div className="flex h-full items-center justify-center py-10">
                            <Spinner className="size-4" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-6 text-center text-sm text-neutral-500">Ürün bulunamadı</div>
                    ) : (
                        <ul className="divide-y divide-neutral-100">
                            {products.map((product) => (
                                <li key={product.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProductId(product.id)}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition",
                                            selectedProductId === product.id
                                                ? "bg-brand/10 text-brand"
                                                : "hover:bg-neutral-50",
                                        )}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium text-neutral-900">
                                                {product.name}
                                            </span>
                                            <span className="font-mono text-[11px] text-neutral-500">
                                                {product.code}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-neutral-900">
                        {selectedProduct ? selectedProduct.name : "Varyantlar"}
                    </div>
                    <Badge variant="outline">{value.length} varyant seçili</Badge>
                </div>

                <ScrollArea className="h-70 rounded-2xl border border-neutral-200">
                    {!selectedProductId ? (
                        <div className="flex h-70 flex-col items-center justify-center gap-2 text-sm text-neutral-500">
                            <PackageSearch className="h-7 w-7 text-neutral-400" />
                            Soldan bir ürün seçin
                        </div>
                    ) : variantsQuery.isLoading ? (
                        <div className="flex h-70 items-center justify-center">
                            <Spinner className="size-4" />
                        </div>
                    ) : variants.length === 0 ? (
                        <div className="p-6 text-center text-sm text-neutral-500">
                            Bu üründe varyant yok
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-100">
                            {variants.map((variant) => {
                                const isSelected = selectedIds.has(variant.id)

                                return (
                                    <li key={variant.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggleVariant(variant.id, variant.fullCode)}
                                            aria-pressed={isSelected}
                                            className={cn(
                                                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition",
                                                isSelected ? "bg-brand/10" : "hover:bg-neutral-50",
                                            )}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-mono text-xs font-medium text-neutral-900">
                                                    {variant.fullCode}
                                                </span>
                                                <span className="block truncate text-[11px] text-neutral-500">
                                                    {variant.name}
                                                </span>
                                            </span>
                                            <span
                                                className={cn(
                                                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                                                    isSelected
                                                        ? "border-brand bg-brand text-white"
                                                        : "border-neutral-300 bg-white",
                                                )}
                                            >
                                                {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </ScrollArea>
            </div>

            {value.length > 0 ? (
                <div className="lg:col-span-2">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Seçili varyantlar — boş bırakılan oran kampanya geneline düşer
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {value.map((item) => (
                            <div
                                key={item.productVariantId}
                                className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5"
                            >
                                <span className="font-mono text-xs font-medium text-neutral-800">
                                    {item.fullCode}
                                </span>
                                <Input
                                    value={item.discountPercent ?? ""}
                                    onChange={(event) => {
                                        const raw = event.target.value.trim()
                                        const parsed = raw === "" ? null : Number(raw)

                                        onChange(value.map((candidate) =>
                                            candidate.productVariantId === item.productVariantId
                                                ? {
                                                    ...candidate,
                                                    discountPercent:
                                                        parsed === null || Number.isNaN(parsed) ? null : parsed,
                                                }
                                                : candidate,
                                        ))
                                    }}
                                    inputMode="decimal"
                                    placeholder="%"
                                    aria-label={`${item.fullCode} indirim oranı`}
                                    className="h-7 w-16 px-2 text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`${item.fullCode} varyantını çıkar`}
                                    onClick={() =>
                                        onChange(value.filter(
                                            (candidate) => candidate.productVariantId !== item.productVariantId,
                                        ))
                                    }
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
