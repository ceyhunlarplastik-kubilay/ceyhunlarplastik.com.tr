"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCustomerFeaturedProducts } from "@/features/admin/customers/hooks/useCustomerFeaturedProducts"
import { useReplaceCustomerFeaturedProducts } from "@/features/admin/customers/hooks/useReplaceCustomerFeaturedProducts"
import { useProducts } from "@/features/admin/products/hooks/useProducts"

type Props = {
    customerId: string
}

export function CustomerFeaturedProductsPageClient({ customerId }: Props) {
    const [search, setSearch] = useState("")
    const featuredQuery = useCustomerFeaturedProducts(customerId)
    const replaceMutation = useReplaceCustomerFeaturedProducts(customerId)
    const productsQuery = useProducts({
        params: {
            page: 1,
            limit: 50,
            ...(search.trim() ? { search: search.trim() } : {}),
        },
    })

    const featured = featuredQuery.data ?? []
    const products = productsQuery.data?.data ?? []
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    useEffect(() => {
        setSelectedIds(featured.map((item) => item.productId))
    }, [featured])

    const selectedProducts = useMemo(() => {
        const fromFeatured = featured.filter((item) => selectedIds.includes(item.productId))
        const knownIds = new Set(fromFeatured.map((item) => item.productId))
        const draftOnly = products
            .filter((product) => selectedIds.includes(product.id) && !knownIds.has(product.id))
            .map((product, index) => ({
                id: `draft-${product.id}-${index}`,
                customerId,
                productId: product.id,
                displayOrder: index,
                createdByUserId: "",
                createdAt: "",
                updatedAt: "",
                product,
            }))

        return [...fromFeatured, ...draftOnly]
    }, [customerId, featured, products, selectedIds])

    function toggleProduct(productId: string) {
        setSelectedIds((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId])
    }

    async function handleSave() {
        try {
            await replaceMutation.mutateAsync(selectedIds)
            toast.success("Tanımlı ürünler güncellendi")
        } catch {
            toast.error("Tanımlı ürünler güncellenemedi")
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-950">Tanımlı Ürünler</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            Müşteriye özel olarak öne çıkarılacak ürünleri seçin.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={replaceMutation.isPending}>
                        {replaceMutation.isPending ? "Kaydediliyor..." : "Ürün Seçimini Kaydet"}
                    </Button>
                </div>

                <div className="mb-4">
                    <Input
                        placeholder="Ürün adı veya kodu ara"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {featuredQuery.isLoading || productsQuery.isLoading ? (
                    <div className="flex min-h-[160px] items-center justify-center">
                        <Spinner className="size-5" />
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {products.map((product) => {
                                const checked = selectedIds.includes(product.id)
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => toggleProduct(product.id)}
                                        className={`rounded-2xl border p-4 text-left transition ${checked ? "border-brand bg-brand/5 shadow-sm" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">{product.code}</div>
                                                <div className="mt-1 text-sm font-semibold text-neutral-900">{product.name}</div>
                                            </div>
                                            {checked ? <Badge>Seçildi</Badge> : null}
                                        </div>
                                        <div className="mt-3 text-xs text-neutral-500">
                                            {product.category?.name ?? "Kategori yok"}
                                        </div>
                                    </button>
                                )
                            })}
                            {!productsQuery.isLoading && products.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
                                    Aramaya uygun ürün bulunamadı.
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-3 text-sm font-semibold text-neutral-900">Seçili Ürünler</div>
                            <div className="space-y-2">
                                {selectedProducts.length > 0 ? selectedProducts.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                                        <div className="font-medium text-neutral-900">{item.product.name}</div>
                                        <div className="text-xs text-neutral-500">{item.product.code}</div>
                                    </div>
                                )) : (
                                    <div className="text-sm text-neutral-500">Henüz ürün seçilmedi.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
