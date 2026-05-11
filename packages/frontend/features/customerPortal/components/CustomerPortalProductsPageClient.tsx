"use client"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { usePortalFeaturedProducts } from "@/features/customerPortal/hooks/usePortalFeaturedProducts"

export function CustomerPortalProductsPageClient() {
    const query = usePortalFeaturedProducts()
    const products = query.data ?? []

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Tanımlı Ürünler</h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Satış temsilcimiz tarafından firmanız için öne çıkarılan ürünler.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {query.isLoading ? (
                    <div className="flex min-h-[220px] items-center justify-center rounded-3xl border bg-white shadow-sm lg:col-span-2">
                        <Spinner className="size-5" />
                    </div>
                ) : products.map((item) => (
                    <div key={item.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">{item.product.code}</div>
                                <div className="mt-1 text-lg font-semibold text-neutral-950">{item.product.name}</div>
                            </div>
                            <Badge variant="secondary">{item.product.category?.name ?? "Kategori"}</Badge>
                        </div>
                        {item.product.description ? (
                            <p className="mt-3 text-sm leading-6 text-neutral-600">{item.product.description}</p>
                        ) : null}
                    </div>
                ))}
                {!query.isLoading && products.length === 0 ? (
                    <div className="rounded-3xl border border-dashed bg-white p-8 text-sm text-neutral-500 shadow-sm lg:col-span-2">
                        Henüz firmanız için tanımlı ürün bulunmuyor.
                    </div>
                ) : null}
            </div>
        </div>
    )
}
