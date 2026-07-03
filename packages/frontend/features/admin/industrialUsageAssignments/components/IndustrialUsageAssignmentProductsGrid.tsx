"use client"

import { CheckCircle2, ImageIcon, Link2, PackageCheck, PackagePlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { IndustrialUsageAssignmentProduct } from "@/features/admin/industrialUsageAssignments/api/types"

type Props = {
    products: IndustrialUsageAssignmentProduct[]
    isLoading?: boolean
    isFetching?: boolean
    pendingAddIds: Set<string>
    pendingRemoveIds: Set<string>
    onToggleProduct: (product: IndustrialUsageAssignmentProduct, checked: boolean) => void
}

function getCheckedState(
    product: IndustrialUsageAssignmentProduct,
    pendingAddIds: Set<string>,
    pendingRemoveIds: Set<string>,
) {
    if (pendingAddIds.has(product.id)) return true
    if (pendingRemoveIds.has(product.id)) return false
    return product.isAssigned
}

function getStatusLabel(
    product: IndustrialUsageAssignmentProduct,
    pendingAddIds: Set<string>,
    pendingRemoveIds: Set<string>,
) {
    if (pendingAddIds.has(product.id)) return "Eklenecek"
    if (pendingRemoveIds.has(product.id)) return "Çıkarılacak"
    return product.isAssigned ? "Atanmış" : "Atanmamış"
}

export function IndustrialUsageAssignmentProductsGrid({
    products,
    isLoading = false,
    isFetching = false,
    pendingAddIds,
    pendingRemoveIds,
    onToggleProduct,
}: Props) {
    if (isLoading) {
        return (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-[4/5] rounded-3xl" />
                ))}
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-500">
                    <PackagePlus className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-neutral-950">
                    Ürün bulunamadı
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                    Seçili filtrelerle eşleşen ürün yok. Aramayı veya atanma filtresini değiştirin.
                </p>
            </div>
        )
    }

    return (
        <div className="relative">
            {isFetching ? (
                <div className="absolute right-3 top-3 z-10 rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-xs font-medium text-neutral-500 shadow-sm backdrop-blur">
                    Yenileniyor
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {products.map((product) => {
                    const checked = getCheckedState(product, pendingAddIds, pendingRemoveIds)
                    const statusLabel = getStatusLabel(product, pendingAddIds, pendingRemoveIds)
                    const isPendingAdd = pendingAddIds.has(product.id)
                    const isPendingRemove = pendingRemoveIds.has(product.id)
                    const toggleProduct = () => onToggleProduct(product, !checked)

                    return (
                        <div
                            key={product.id}
                            className={cn(
                                "group flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition",
                                checked
                                    ? "border-brand/30 bg-brand/[0.03]"
                                    : "border-neutral-200 hover:border-neutral-300",
                                isPendingRemove && "border-red-200 bg-red-50/50",
                            )}
                        >
                            <div className="relative aspect-square overflow-hidden bg-neutral-50">
                                <button
                                    type="button"
                                    aria-pressed={checked}
                                    aria-label={`${product.name} ürününü ${checked ? "seçimden çıkar" : "seç"}`}
                                    onClick={toggleProduct}
                                    className="absolute inset-0 cursor-pointer outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                                >
                                    {product.primaryImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={product.primaryImageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-neutral-300" />
                                        </div>
                                    )}

                                    <span className="absolute left-3 top-3">
                                        <Badge
                                            className={cn(
                                                "rounded-full border bg-white/90 shadow-sm backdrop-blur",
                                                checked
                                                    ? "border-brand/20 text-brand"
                                                    : "border-neutral-200 text-neutral-500",
                                                isPendingRemove && "border-red-200 bg-red-50 text-red-700",
                                                isPendingAdd && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                            )}
                                            variant="outline"
                                        >
                                            {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PackageCheck className="h-3.5 w-3.5" />}
                                            {statusLabel}
                                        </Badge>
                                    </span>
                                </button>

                                <div
                                    className="absolute right-3 top-3 rounded-xl border border-neutral-200 bg-white/90 p-2 shadow-sm backdrop-blur"
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(value) => onToggleProduct(product, value === true)}
                                        aria-label={`${product.name} ürününü seç`}
                                        className="h-5 w-5 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="flex min-h-[176px] flex-1 flex-col p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm font-semibold text-neutral-900">
                                        {product.code}
                                    </span>
                                    {product.category ? (
                                        <Badge variant="outline" className="max-w-full rounded-full bg-white">
                                            <span className="truncate">{product.category.name}</span>
                                        </Badge>
                                    ) : null}
                                </div>

                                <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-neutral-950">
                                    {product.name}
                                </h3>

                                <div className="mt-auto space-y-2 pt-4 text-xs text-neutral-500">
                                    <div className="flex min-w-0 items-center gap-1">
                                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{product.slug}</span>
                                    </div>
                                    <div>{product.industrialUsageCount} kullanım bağlantısı</div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
