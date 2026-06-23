"use client"

import Link from "next/link"
import { ArrowRight, Boxes } from "lucide-react"
import { MotionMarquee } from "@/components/ui/MotionMarquee"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { CustomerAttributeValue } from "@/features/admin/customers/api/types"
import type { Product } from "@/features/public/products/types"
import { CustomerPortalUsageAreaProductCard } from "@/features/customerPortal/components/usageArea/CustomerPortalUsageAreaProductCard"

type Props = {
    selectedUsageArea: CustomerAttributeValue | null
    allProductsHref: string
    products: Product[]
    totalProducts: number
    pageSize: number
    isInitialLoading: boolean
    hasNextPage: boolean
    isFetchingNextPage: boolean
    onLoadMore: () => void
}

export function CustomerPortalUsageAreaProductRail({
    selectedUsageArea,
    allProductsHref,
    products,
    totalProducts,
    pageSize,
    isInitialLoading,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: Props) {
    if (!selectedUsageArea) {
        return null
    }

    return (
        <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,1))] p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <Boxes className="size-3.5" />
                        Seçili Kullanım Alanı
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight text-slate-950">
                            {selectedUsageArea.name}
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            Önerilen model sayısı {totalProducts}
                        </span>
                    </div>
                </div>

                <Button asChild variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs">
                    <Link href={allProductsHref}>
                        Tümünü Aç
                        <ArrowRight className="size-3.5" />
                    </Link>
                </Button>
            </div>

            {isInitialLoading ? (
                <div className="mt-3 flex min-h-[160px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white/80">
                    <Spinner className="size-5" />
                </div>
            ) : products.length > 0 ? (
                <>
                    <MotionMarquee
                        speed={38}
                        direction="left"
                        gap="gap-2.5"
                        className="mt-3 py-1"
                    >
                        {products.map((product) => (
                            <CustomerPortalUsageAreaProductCard key={product.id} product={product} />
                        ))}
                    </MotionMarquee>

                    {hasNextPage ? (
                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={onLoadMore}
                                disabled={isFetchingNextPage}
                                className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isFetchingNextPage ? (
                                    <Spinner className="size-5" />
                                ) : (
                                    <span className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                                        <ArrowRight className="size-3.5" />
                                    </span>
                                )}
                                <span className="font-semibold text-slate-900">
                                    Daha Fazlası
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    Sonraki {pageSize} modeli ekle
                                </span>
                            </button>
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="mt-3 rounded-[20px] border border-dashed border-slate-200 bg-white/85 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                        Bu kullanım alanı için ürün modeli bulunamadı.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Farklı bir kullanım alanı seçerek veya kataloğu açarak devam edebilirsiniz.
                    </p>
                </div>
            )}
        </div>
    )
}
