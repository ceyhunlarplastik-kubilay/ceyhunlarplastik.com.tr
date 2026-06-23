"use client"

import Link from "next/link"
import type { Product } from "@/features/public/products/types"

type Props = {
    product: Product
}

function getProductImageUrl(product: Product) {
    const primaryAsset = product.assets?.find((asset: { role?: string }) => asset.role === "PRIMARY")
    const fallbackAsset = product.assets?.find((asset: { type?: string }) => asset.type === "IMAGE")

    return primaryAsset?.url || fallbackAsset?.url || "/placeholder.webp"
}

export function CustomerPortalUsageAreaProductCard({ product }: Props) {
    const imageUrl = getProductImageUrl(product)

    return (
        <div className="w-[124px] shrink-0 sm:w-[132px]">
            <Link
                href={`/musteri/tum-urunler/urun/${product.slug}`}
                className="group block h-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_28px_-24px_rgba(15,23,42,0.45)]"
            >
                <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,179,93,0.16),transparent_34%),linear-gradient(160deg,#f8fafc_0%,#eef2ff_56%,#ffffff_100%)] p-2.5">
                    <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full border border-white/85 bg-white/92 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 shadow-sm">
                        {product.code}
                    </span>

                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[16px] border border-white/80 bg-white/90 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    </div>
                </div>

                <div className="space-y-1 px-2.5 pb-2.5 pt-2">
                    <div className="line-clamp-2 text-[12px] font-semibold leading-4 text-slate-950">
                        {product.name}
                    </div>
                    <div className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                        {product.category?.name ?? "Ürün Modeli"}
                    </div>
                </div>
            </Link>
        </div>
    )
}
