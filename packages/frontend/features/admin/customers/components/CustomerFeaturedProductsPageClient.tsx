"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCustomerAssignedProducts } from "@/features/admin/customers/hooks/useCustomerAssignedProducts"
import { useCustomerFeaturedProducts } from "@/features/admin/customers/hooks/useCustomerFeaturedProducts"
import { useReplaceCustomerAssignedProducts } from "@/features/admin/customers/hooks/useReplaceCustomerAssignedProducts"
import { useReplaceCustomerFeaturedProducts } from "@/features/admin/customers/hooks/useReplaceCustomerFeaturedProducts"
import { useProducts as useAdminProducts } from "@/features/admin/products/hooks/useProducts"
import { useProducts as usePublicProducts } from "@/features/public/products/hooks/useProducts"
import { protectedApiClient } from "@/lib/http/client"
import type {
    CustomerAssignedProductsResponse,
    CustomerFeaturedProductsResponse,
} from "@/features/admin/customers/api/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type Props = {
    customerId: string
    scope?: "admin" | "sales"
    mode?: "featured" | "assigned"
}

async function getManagedCustomerFeaturedProducts(customerId: string) {
    const res = await protectedApiClient.get<CustomerFeaturedProductsResponse>(
        `/sales/customers/${customerId}/featured-products`,
    )
    return res.data.payload.data
}

async function replaceManagedCustomerFeaturedProducts(customerId: string, productIds: string[]) {
    const res = await protectedApiClient.put<CustomerFeaturedProductsResponse>(
        `/sales/customers/${customerId}/featured-products`,
        { productIds },
    )
    return res.data.payload.data
}

async function getManagedCustomerAssignedProducts(customerId: string) {
    const res = await protectedApiClient.get<CustomerAssignedProductsResponse>(
        `/sales/customers/${customerId}/assigned-products`,
    )
    return res.data.payload.data
}

async function replaceManagedCustomerAssignedProducts(customerId: string, productIds: string[]) {
    const res = await protectedApiClient.put<CustomerAssignedProductsResponse>(
        `/sales/customers/${customerId}/assigned-products`,
        { productIds },
    )
    return res.data.payload.data
}

function useManagedCustomerFeaturedProducts(customerId: string, enabled: boolean) {
    return useQuery({
        queryKey: ["sales-customer-featured-products", customerId],
        queryFn: () => getManagedCustomerFeaturedProducts(customerId),
        enabled: Boolean(customerId) && enabled,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}

function useReplaceManagedCustomerFeaturedProducts(customerId: string, enabled: boolean) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (productIds: string[]) => replaceManagedCustomerFeaturedProducts(customerId, productIds),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["sales-customer-featured-products", customerId] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customer", customerId] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customers"] })
        },
    })
}

function useManagedCustomerAssignedProducts(customerId: string, enabled: boolean) {
    return useQuery({
        queryKey: ["sales-customer-assigned-products", customerId],
        queryFn: () => getManagedCustomerAssignedProducts(customerId),
        enabled: Boolean(customerId) && enabled,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}

function useReplaceManagedCustomerAssignedProducts(customerId: string, enabled: boolean) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (productIds: string[]) => replaceManagedCustomerAssignedProducts(customerId, productIds),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["sales-customer-assigned-products", customerId] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customer", customerId] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customers"] })
        },
    })
}

export function CustomerFeaturedProductsPageClient({
    customerId,
    scope = "admin",
    mode = "featured",
}: Props) {
    const [search, setSearch] = useState("")
    const adminFeaturedQuery = useCustomerFeaturedProducts(customerId, scope === "admin")
    const adminAssignedQuery = useCustomerAssignedProducts(customerId, scope === "admin")
    const salesFeaturedQuery = useManagedCustomerFeaturedProducts(customerId, scope === "sales")
    const salesAssignedQuery = useManagedCustomerAssignedProducts(customerId, scope === "sales")
    const adminReplaceMutation = useReplaceCustomerFeaturedProducts(customerId)
    const adminAssignedReplaceMutation = useReplaceCustomerAssignedProducts(customerId)
    const salesReplaceMutation = useReplaceManagedCustomerFeaturedProducts(customerId, scope === "sales")
    const salesAssignedReplaceMutation = useReplaceManagedCustomerAssignedProducts(customerId, scope === "sales")
    const adminProductsQuery = useAdminProducts({
        enabled: scope === "admin",
        params: {
            page: 1,
            limit: 50,
            ...(search.trim() ? { search: search.trim() } : {}),
        },
    })
    const salesProductsQuery = usePublicProducts({
        page: 1,
        limit: 50,
        ...(search.trim() ? { search: search.trim() } : {}),
    })
    const productsQuery = scope === "sales" ? salesProductsQuery : adminProductsQuery

    const selectionQuery = scope === "sales"
        ? mode === "assigned" ? salesAssignedQuery : salesFeaturedQuery
        : mode === "assigned" ? adminAssignedQuery : adminFeaturedQuery
    const replaceMutation = scope === "sales"
        ? mode === "assigned" ? salesAssignedReplaceMutation : salesReplaceMutation
        : mode === "assigned" ? adminAssignedReplaceMutation : adminReplaceMutation

    const content = mode === "assigned"
        ? {
            badge: "Tanımlı Ürün Havuzu",
            title: "Tanımlı Ürünler",
            description: scope === "sales"
                ? "Müşteriye düzenli veya yüksek hacimli satılan ürünleri seçin."
                : "Müşterinin tanımlı ürün portföyünü oluşturacak ürünleri seçin.",
            successMessage: "Tanımlı ürünler güncellendi",
            errorMessage: "Tanımlı ürünler güncellenemedi",
            emptySelected: "Henüz tanımlı ürün seçilmedi.",
        }
        : {
            badge: "Müşteriye Özel Ürünler",
            title: "İlgili Ürünler",
            description: scope === "sales"
                ? "Sorumlu olduğunuz müşteri için ilgili ürünleri seçin."
                : "Müşteriyle ilişkili veya öne çıkarılacak ürünleri seçin.",
            successMessage: "İlgili ürünler güncellendi",
            errorMessage: "İlgili ürünler güncellenemedi",
            emptySelected: "Henüz ilgili ürün seçilmedi.",
        }

    const featured = selectionQuery.data ?? []
    const products = productsQuery.data?.data ?? []
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    useEffect(() => {
        const nextIds = featured.map((item) => item.productId)
        setSelectedIds((prev) => {
            if (
                prev.length === nextIds.length &&
                prev.every((id, index) => id === nextIds[index])
            ) {
                return prev
            }

            return nextIds
        })
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
            toast.success(content.successMessage)
        } catch {
            toast.error(content.errorMessage)
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            {content.badge}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-neutral-950">{content.title}</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            {content.description}
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

                {selectionQuery.isLoading || productsQuery.isLoading ? (
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
                                    <div className="text-sm text-neutral-500">{content.emptySelected}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
