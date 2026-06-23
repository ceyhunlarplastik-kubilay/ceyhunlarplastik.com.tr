"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type {
    CustomerAssignedProduct,
    CustomerAssignedProductsResponse,
} from "@/features/admin/customers/api/types"
import { ProductCategoryFilterRail } from "@/features/admin/products/components/ProductCategoryFilterRail"
import { useCustomerAssignedProducts } from "@/features/admin/customers/hooks/useCustomerAssignedProducts"
import { useReplaceCustomerAssignedProducts } from "@/features/admin/customers/hooks/useReplaceCustomerAssignedProducts"
import type { Category } from "@/features/public/categories/types"
import ProductActiveFilters from "@/features/public/products/components/ProductActiveFilters"
import ProductFilterPagination from "@/features/public/products/components/ProductFilterPagination"
import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import { useProductVariantTable } from "@/features/public/products/hooks/useProductVariantTable"
import type { ProductAttribute } from "@/features/public/productAttributes/types"
import type { Product } from "@/features/public/products/types"
import { protectedApiClient } from "@/lib/http/client"
import { formatAssignedProductVariantSummary, getAssignedProductVariantImageUrl } from "@/lib/customers/assignedProductVariants"
import { cn } from "@/lib/utils"

type Props = {
    customerId: string
    scope?: "admin" | "sales"
    categories: Category[]
    attributes: ProductAttribute[]
    basePath: string
}

const INDUSTRIAL_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

async function getManagedCustomerAssignedProducts(customerId: string) {
    const res = await protectedApiClient.get<CustomerAssignedProductsResponse>(
        `/sales/customers/${customerId}/assigned-products`,
    )
    return res.data.payload.data
}

async function replaceManagedCustomerAssignedProducts(customerId: string, productVariantIds: string[]) {
    const res = await protectedApiClient.put<CustomerAssignedProductsResponse>(
        `/sales/customers/${customerId}/assigned-products`,
        { productVariantIds },
    )
    return res.data.payload.data
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

function useReplaceManagedCustomerAssignedProducts(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (productVariantIds: string[]) => replaceManagedCustomerAssignedProducts(customerId, productVariantIds),
        onSuccess(data) {
            qc.setQueryData(["sales-customer-assigned-products", customerId], data)
            qc.invalidateQueries({ queryKey: ["sales-customer-assigned-products", customerId] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customer", customerId] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customers"] })
        },
    })
}

function mapVariantTableDataToAssignedVariant(
    product: Product,
    variant: VariantTableData,
): CustomerAssignedProduct["productVariant"] {
    return {
        id: variant.id,
        productId: product.id,
        name: variant.name,
        fullCode: variant.fullCode,
        versionCode: variant.versionCode,
        supplierCode: variant.versionCode,
        variantIndex: 0,
        color: variant.color
            ? {
                id: variant.color.id,
                name: variant.color.name,
                code: variant.color.code,
                hex: variant.color.hex,
                system: variant.color.system,
            }
            : null,
        materials: (variant.materials ?? []).map((material) => ({
            id: material.id,
            name: material.name,
            code: material.code ?? null,
        })),
        measurements: (variant.measurements ?? []).map((measurement) => ({
            id: measurement.id,
            value: measurement.value,
            label: measurement.label,
            measurementType: {
                id: measurement.measurementType.id,
                code: measurement.measurementType.code,
                name: measurement.measurementType.name,
                baseUnit: measurement.measurementType.baseUnit ?? null,
                displayOrder: measurement.measurementType.displayOrder,
            },
        })),
        assets: [],
        product,
    }
}

function getProductImageUrl(product: Product) {
    const primary = product.assets?.find(
        (asset: { role?: string; type?: string; url?: string }) =>
            asset.role === "PRIMARY" && asset.type === "IMAGE",
    )
    const animated = product.assets?.find(
        (asset: { role?: string; type?: string; url?: string }) =>
            asset.role === "ANIMATION" && asset.type === "IMAGE",
    )
    const fallback = product.assets?.find(
        (asset: { type?: string; url?: string }) => asset.type === "IMAGE",
    )

    return primary?.url ?? animated?.url ?? fallback?.url ?? "/placeholder.webp"
}

function buildSearchState(searchParams: URLSearchParams, knownAttributeCodes: Set<string>) {
    const selectedAttributes: Record<string, string[]> = {}

    searchParams.forEach((value, key) => {
        if (!knownAttributeCodes.has(key)) return
        selectedAttributes[key] = value.split(",").filter(Boolean)
    })

    return {
        category: searchParams.get("category") ?? "",
        search: searchParams.get("search") ?? "",
        page: Number(searchParams.get("page") ?? 1) || 1,
        limit: Number(searchParams.get("limit") ?? 20) || 20,
        selectedAttributes,
    }
}

function buildDraftAssignedProduct(
    customerId: string,
    variant: CustomerAssignedProduct["productVariant"],
    displayOrder: number,
): CustomerAssignedProduct {
    return {
        id: `draft-${variant.id}`,
        customerId,
        productVariantId: variant.id,
        displayOrder,
        createdByUserId: "",
        createdAt: "",
        updatedAt: "",
        productVariant: variant,
    }
}

export function CustomerAssignedVariantsPageClient({
    customerId,
    scope = "admin",
    categories,
    attributes,
    basePath,
}: Props) {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [draftSelectedVariantIds, setDraftSelectedVariantIds] = useState<string[]>([])
    const [hasDraftSelection, setHasDraftSelection] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const adminAssignedQuery = useCustomerAssignedProducts(customerId, scope === "admin")
    const salesAssignedQuery = useManagedCustomerAssignedProducts(customerId, scope === "sales")
    const adminReplaceMutation = useReplaceCustomerAssignedProducts(customerId)
    const salesReplaceMutation = useReplaceManagedCustomerAssignedProducts(customerId)

    const assignedQuery = scope === "sales" ? salesAssignedQuery : adminAssignedQuery
    const replaceMutation = scope === "sales" ? salesReplaceMutation : adminReplaceMutation
    const assignedProducts = useMemo(() => assignedQuery.data ?? [], [assignedQuery.data])
    const knownAttributeCodes = useMemo(
        () => new Set(attributes.map((attribute) => attribute.code)),
        [attributes],
    )
    const queryState = useMemo(
        () => buildSearchState(new URLSearchParams(searchParams.toString()), knownAttributeCodes),
        [knownAttributeCodes, searchParams],
    )
    const selectedCategory = useMemo(
        () => categories.find((item) => item.slug === queryState.category),
        [categories, queryState.category],
    )
    const productQueryParams = useMemo(() => {
        const nextParams: Record<string, string | number> = {
            page: queryState.page,
            limit: queryState.limit,
            sort: "code",
            order: "asc",
        }

        if (queryState.category) {
            nextParams.category = queryState.category
        }

        if (queryState.search.trim()) {
            nextParams.search = queryState.search.trim()
        }

        Object.entries(queryState.selectedAttributes).forEach(([key, values]) => {
            if (!knownAttributeCodes.has(key)) return

            const isIndustrialAttribute = INDUSTRIAL_ATTRIBUTE_CODES.has(key)
            if (queryState.category && isIndustrialAttribute) return
            if (!queryState.category && !isIndustrialAttribute) return

            if (values.length > 0) {
                nextParams[key] = values.join(",")
            }
        })

        return nextParams
    }, [
        knownAttributeCodes,
        queryState.category,
        queryState.limit,
        queryState.page,
        queryState.search,
        queryState.selectedAttributes,
    ])
    const productsQuery = useProducts(productQueryParams)
    const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data?.data])
    const selectedProduct = useMemo(() => {
        if (!selectedProductId) return null
        return products.find((product) => product.id === selectedProductId) ?? null
    }, [products, selectedProductId])
    const variantsQuery = useProductVariantTable(selectedProduct?.id ?? "")
    const assignedVariantIds = useMemo(
        () => assignedProducts.map((item) => item.productVariantId),
        [assignedProducts],
    )
    const selectedVariantIds = hasDraftSelection ? draftSelectedVariantIds : assignedVariantIds

    const knownVariantsById = useMemo(() => {
        const next: Record<string, CustomerAssignedProduct["productVariant"]> = {}

        for (const item of assignedProducts) {
            next[item.productVariantId] = item.productVariant
        }

        if (selectedProduct) {
            for (const variant of variantsQuery.data ?? []) {
                next[variant.id] = mapVariantTableDataToAssignedVariant(selectedProduct, variant)
            }
        }

        return next
    }, [assignedProducts, selectedProduct, variantsQuery.data])

    const selectedItems = useMemo(() => {
        const assignedByVariantId = new Map(
            assignedProducts.map((item) => [item.productVariantId, item] as const),
        )

        return selectedVariantIds
            .map((variantId, index) => {
                const existing = assignedByVariantId.get(variantId)
                if (existing) return existing

                const variant = knownVariantsById[variantId]
                if (!variant) return null

                return buildDraftAssignedProduct(customerId, variant, index)
            })
            .filter((item): item is CustomerAssignedProduct => Boolean(item))
    }, [assignedProducts, customerId, knownVariantsById, selectedVariantIds])

    const selectedProductVariants = useMemo(
        () =>
            (variantsQuery.data ?? []).map((variant) => ({
                raw: variant,
                mapped: selectedProduct ? mapVariantTableDataToAssignedVariant(selectedProduct, variant) : null,
            })),
        [selectedProduct, variantsQuery.data],
    )
    const selectedVariantCountForProduct = useMemo(
        () =>
            selectedProductVariants.reduce(
                (count, item) => (selectedVariantIds.includes(item.raw.id) ? count + 1 : count),
                0,
            ),
        [selectedProductVariants, selectedVariantIds],
    )
    const isDirty = selectedVariantIds.length !== assignedVariantIds.length
        || selectedVariantIds.some((id, index) => assignedVariantIds[index] !== id)
    const isInitialProductLoading = productsQuery.isLoading && products.length === 0
    const isProductRefetching = productsQuery.isFetching && !isInitialProductLoading

    function handleCategoryIdChange(categoryId: string) {
        const nextCategorySlug = categories.find((item) => item.id === categoryId)?.slug
        const nextParams = new URLSearchParams(searchParams.toString())

        if (nextCategorySlug) {
            nextParams.set("category", nextCategorySlug)
        } else {
            nextParams.delete("category")
        }

        Array.from(nextParams.keys()).forEach((key) => {
            if (!knownAttributeCodes.has(key)) return

            const isIndustrialAttribute = INDUSTRIAL_ATTRIBUTE_CODES.has(key)
            if (nextCategorySlug && isIndustrialAttribute) nextParams.delete(key)
            if (!nextCategorySlug && !isIndustrialAttribute) nextParams.delete(key)
        })

        nextParams.set("page", "1")
        if (!nextParams.get("limit")) {
            nextParams.set("limit", String(queryState.limit))
        }

        router.replace(`${basePath}?${nextParams.toString()}`, { scroll: false })
    }

    function toggleVariant(variantId: string) {
        setHasDraftSelection(true)
        setDraftSelectedVariantIds((current) => {
            const base = hasDraftSelection ? current : assignedVariantIds

            return base.includes(variantId)
                ? base.filter((id) => id !== variantId)
                : [...base, variantId]
        })
    }

    async function handleSave() {
        try {
            await replaceMutation.mutateAsync(selectedVariantIds)
            setHasDraftSelection(false)
            setDraftSelectedVariantIds([])
            toast.success("Tanımlı ürün varyantları güncellendi.")
        } catch {
            toast.error("Tanımlı ürün varyantları güncellenemedi.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            Tanımlı Varyant Havuzu
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-neutral-950">Tanımlı Ürün Varyantları</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            Önce ürün modelini katalogdan filtreleyin. Ardından o ürüne ait gerçek varyantlardan birini
                            veya birkaçını seçerek müşteriye tanımlayın.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                        <Button onClick={handleSave} disabled={replaceMutation.isPending || !isDirty}>
                            {replaceMutation.isPending ? "Kaydediliyor..." : "Varyant Seçimini Kaydet"}
                        </Button>
                        <div className="text-xs text-neutral-500">
                            {isDirty
                                ? `${selectedItems.length} varyant seçildi, kaydetmeyi bekliyor`
                                : "Mevcut tanımlı varyant listesi güncel"}
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    Ürün modelleri aşağıdaki katalogdan filtrelenir. Bir ürüne tıkladığınızda sadece o ürüne ait
                    varyantlar listelenir ve kayıt varyant bazında yapılır.
                </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm lg:p-5">
                <ProductCategoryFilterRail
                    categories={categories}
                    categoryId={selectedCategory?.id ?? ""}
                    onCategoryIdChange={handleCategoryIdChange}
                    railMode="all"
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                    <div className="grid gap-5 2xl:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="min-w-0">
                            <ProductFilterSidebar
                                categories={categories}
                                attributes={attributes}
                                hideCategoryFilter
                                fixedCategorySlug={queryState.category || undefined}
                                basePath={basePath}
                                showSelectedCategoryPreview
                                showProductSearch
                                productSearchPlaceholder="Ürün kodu veya adı ara"
                                attributeSelectorVariant="popover"
                                showProductFiltersOnlyWhenCategorySelected
                                hideIndustrialFiltersWhenCategorySelected
                            />
                        </div>

                        <div className="min-w-0 space-y-4">
                            <ProductActiveFilters basePath={basePath} />

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-100 pb-4">
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-900">
                                            {isInitialProductLoading
                                                ? "Ürünler hazırlanıyor"
                                                : `${productsQuery.data?.meta.total ?? 0} ürün modeli bulundu`}
                                        </div>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            {selectedCategory
                                                ? `${selectedCategory.name} kategorisi için filtrelenmiş ürün modelleri`
                                                : "Tüm kategorilerden ürün modelleri"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                        <span>Sayfa başına {productsQuery.data?.meta.limit ?? queryState.limit} ürün</span>
                                        {isProductRefetching ? <Badge variant="secondary">Güncelleniyor</Badge> : null}
                                    </div>
                                </div>

                                {isInitialProductLoading ? (
                                    <div className="flex min-h-[260px] items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                ) : products.length > 0 ? (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {products.map((product) => {
                                                const isActive = selectedProduct?.id === product.id

                                                return (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => setSelectedProductId(product.id)}
                                                        className={cn(
                                                            "group rounded-[24px] border bg-white p-3 text-left transition",
                                                            isActive
                                                                ? "border-brand bg-brand/5 shadow-sm"
                                                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
                                                        )}
                                                    >
                                                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                                                            <Image
                                                                src={getProductImageUrl(product)}
                                                                alt={product.name}
                                                                fill
                                                                sizes="(max-width: 1280px) 50vw, 240px"
                                                                className="object-contain p-4 transition duration-300 group-hover:scale-[1.02]"
                                                            />
                                                        </div>
                                                        <div className="mt-3 flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-[11px] text-neutral-500">{product.code}</div>
                                                                <div className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900">{product.name}</div>
                                                                <div className="mt-2 text-xs text-neutral-500">{product.category?.name ?? "Kategori yok"}</div>
                                                            </div>
                                                            {isActive ? (
                                                                <Badge className="bg-brand text-white hover:bg-brand">Seçili</Badge>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-3 text-xs text-neutral-500">
                                                            Varyantlarını görüntüle ve müşteriye tanımla
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {productsQuery.data?.meta ? (
                                            <ProductFilterPagination
                                                page={productsQuery.data.meta.page}
                                                totalPages={productsQuery.data.meta.totalPages}
                                                basePath={basePath}
                                            />
                                        ) : null}
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-12 text-center text-sm text-neutral-500">
                                        Seçili filtrelere uygun ürün modeli bulunamadı.
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-900">Ürün Varyantları</div>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            {selectedProduct
                                                ? `${selectedProduct.code} kodlu ürünün gerçek varyantlarını seçin veya listeden çıkarın.`
                                                : "Varyant listesini açmak için yukarıdan bir ürün modeli seçin."}
                                        </p>
                                    </div>
                                    {selectedProduct ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">{(variantsQuery.data ?? []).length} varyant</Badge>
                                            <Badge variant="secondary">{selectedVariantCountForProduct} seçili</Badge>
                                        </div>
                                    ) : null}
                                </div>

                                {!selectedProduct ? (
                                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                                        Önce ürün modeli seçin, sonra o ürüne ait varyantlardan birini veya birden fazlasını işaretleyin.
                                    </div>
                                ) : variantsQuery.isLoading ? (
                                    <div className="flex min-h-[180px] items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                ) : selectedProductVariants.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                                                    <Image
                                                        src={getProductImageUrl(selectedProduct)}
                                                        alt={selectedProduct.name}
                                                        fill
                                                        sizes="64px"
                                                        className="object-contain p-2"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-mono text-[11px] text-neutral-500">{selectedProduct.code}</div>
                                                    <div className="mt-1 text-sm font-semibold text-neutral-900">{selectedProduct.name}</div>
                                                    <div className="mt-1 text-xs text-neutral-500">{selectedProduct.category?.name ?? "Kategori yok"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {selectedProductVariants.map(({ raw, mapped }) => {
                                                if (!mapped) return null

                                                const checked = selectedVariantIds.includes(raw.id)

                                                return (
                                                    <button
                                                        key={raw.id}
                                                        type="button"
                                                        onClick={() => toggleVariant(raw.id)}
                                                        className={cn(
                                                            "rounded-2xl border p-4 text-left transition",
                                                            checked
                                                                ? "border-brand bg-brand/5 shadow-sm"
                                                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs text-neutral-500">{raw.fullCode}</div>
                                                                <div className="mt-1 text-sm font-semibold text-neutral-900">{raw.name}</div>
                                                            </div>
                                                            {checked ? (
                                                                <Badge className="gap-1 bg-brand text-white hover:bg-brand">
                                                                    <Check className="h-3 w-3" />
                                                                    Seçildi
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-3 text-xs leading-5 text-neutral-600">
                                                            {formatAssignedProductVariantSummary(mapped)}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                                        Bu ürün için varyant bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 xl:sticky xl:top-6 xl:self-start">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-neutral-900">Seçili Varyantlar</div>
                        <Badge variant="secondary">{selectedItems.length}</Badge>
                    </div>
                    <div className="space-y-3">
                        {selectedItems.length > 0 ? (
                            selectedItems.map((item) => {
                                const product = item.productVariant.product

                                return (
                                    <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                                        <div className="flex gap-3">
                                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                                                <Image
                                                    src={getAssignedProductVariantImageUrl(item.productVariant)}
                                                    alt={product?.name ?? item.productVariant.name}
                                                    fill
                                                    sizes="64px"
                                                    className="object-contain p-2"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-semibold text-neutral-900">
                                                    {product?.name ?? item.productVariant.name}
                                                </div>
                                                <div className="mt-1 font-mono text-[11px] text-neutral-500">
                                                    {item.productVariant.fullCode}
                                                </div>
                                                <div className="mt-2 text-xs leading-5 text-neutral-600">
                                                    {formatAssignedProductVariantSummary(item.productVariant)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleVariant(item.productVariantId)}
                                            >
                                                Listeden Çıkar
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-10 text-center text-sm text-neutral-500">
                                Henüz tanımlı ürün varyantı seçilmedi.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
