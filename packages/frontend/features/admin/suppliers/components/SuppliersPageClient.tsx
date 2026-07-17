"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Package, Truck } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { decimalLikeToFixedText } from "@/lib/utils/decimal"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"

import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import { useSupplierVariantSuppliers } from "@/features/admin/suppliers/hooks/useSupplierVariantSuppliers"
import { useSupplierProducts } from "@/features/admin/suppliers/hooks/useSupplierProducts"
import { useUpdateSupplier } from "@/features/admin/suppliers/hooks/useUpdateSupplier"
import { useBulkUpdateSupplierVariantPricing } from "@/features/admin/suppliers/hooks/useBulkUpdateSupplierVariantPricing"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import { SupplierListFilters } from "@/features/admin/suppliers/components/SupplierListFilters"
import { useSupplierListFilters } from "@/features/admin/suppliers/hooks/useSupplierListFilters"
import { useCategories } from "@/features/admin/categories/hooks/useCategories"
import { CreateVariantDialog } from "@/features/admin/productVariants/components/CreateVariantDialog"
import { useVariantReferences } from "@/features/admin/productVariants/hooks/useVariantReferences"
import { useProductVariants } from "@/features/admin/productVariants/hooks/useProductVariants"
import type { ProductVariant } from "@/features/admin/productVariants/api/types"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { EditSupplierDialog } from "@/features/admin/suppliers/components/EditSupplierDialog"
import { SupplierBulkPricingForm } from "@/features/admin/suppliers/components/SupplierBulkPricingForm"
import { useSupplierWorkspaceState } from "@/features/admin/suppliers/hooks/useSupplierWorkspaceState"
import { getUserDisplayName } from "@/lib/users/displayName"

export function SuppliersPageClient() {
    const {
        filters,
        params: supplierParams,
        setSearch,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useSupplierListFilters()

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
    const supplierWorkspace = useSupplierWorkspaceState()
    const {
        selectedCategoryId,
        productSearch,
        productPage,
        productLimit,
        selectedProductId,
        detailSearch,
        detailPage,
        detailLimit,
    } = supplierWorkspace.state

    const supplierQuery = useSuppliers({
        params: supplierParams,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const updateSupplierMutation = useUpdateSupplier()
    const bulkUpdatePricingMutation = useBulkUpdateSupplierVariantPricing()
    const referencesQuery = useVariantReferences()
    const categoriesQuery = useCategories({ params: { limit: 500 } })
    const usersQuery = useUsers({ params: { page: 1, limit: 500 } })
    const productsQuery = useSupplierProducts({
        supplierId: selectedSupplier?.id,
        page: productPage,
        limit: productLimit,
        ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
        ...(productSearch.trim() ? { search: productSearch.trim() } : {}),
        sort: "name",
        order: "asc",
    })
    const detailQuery = useSupplierVariantSuppliers({
        supplierId: selectedSupplier?.id,
        ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
        ...(selectedProductId ? { productId: selectedProductId } : {}),
        ...(detailSearch.trim() ? { search: detailSearch.trim() } : {}),
        page: detailPage,
        limit: detailLimit,
    })
    const productVariantsQuery = useProductVariants(selectedProductId)

    const suppliers = supplierQuery.data?.data ?? []
    const supplierMeta = supplierQuery.data?.meta
    const categories = categoriesQuery.data?.data ?? []
    const products = productsQuery.data?.data ?? []
    const purchasingUsers = (usersQuery.data?.data ?? []).filter((user) => user.groups.includes("purchasing") || user.groups.includes("admin") || user.groups.includes("owner"))
    const purchasingUserOptions = useMemo(
        () => purchasingUsers.map((user) => ({
            id: user.id,
            label: getUserDisplayName(user) || user.email,
            caption: user.email,
        })),
        [purchasingUsers],
    )
    const productMeta = productsQuery.data?.meta
    const supplierRows = detailQuery.data?.data ?? []
    const supplierRowsMeta = detailQuery.data?.meta
    const selectedProduct = products.find((product) => product.id === selectedProductId)
    const variantById = useMemo(
        () => new Map((productVariantsQuery.data ?? []).map((variant) => [variant.id, variant])),
        [productVariantsQuery.data]
    )

    async function handleSupplierUpdate(payload: {
        id: string
        name?: string
        contactName?: string
        phone?: string
        address?: string
        taxNumber?: string
        defaultPaymentTermDays?: number
        assignedPurchasingUserIds?: string[]
    }) {
        const updatedSupplier = await updateSupplierMutation.mutateAsync(payload)
        setSelectedSupplier((current) => (
            current?.id === updatedSupplier.id
                ? updatedSupplier
                : current
        ))
        setEditingSupplier(null)
    }

    async function handleBulkPricingSubmit(payload: {
        operationalCostRate?: number
        profitRate?: number
    }) {
        if (!selectedSupplier || !selectedProductId) return

        await bulkUpdatePricingMutation.mutateAsync({
            productId: selectedProductId,
            supplierId: selectedSupplier.id,
            ...payload,
        })
        await detailQuery.refetch()
        await productVariantsQuery.refetch()
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tedarikçiler</h1>
                <p className="text-neutral-500 text-sm">
                    Tedarikçileri listeleyin, seçin ve seçilen tedarikçiye bağlı varyant/fiyat kayıtlarını inceleyin.
                </p>
            </div>

            <SupplierListFilters search={filters.search} onSearchChange={setSearch} />

            <AdminListRefreshBar
                dataUpdatedAt={supplierQuery.dataUpdatedAt}
                isFetching={supplierQuery.isFetching}
                onRefresh={() => void supplierQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tedarikçi</TableHead>
                            <TableHead>Satın Almacı</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Oluşturma</TableHead>
                            <TableHead className="text-right pr-4">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {supplierQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>
                                    {(supplier.assignedPurchasingSuppliers ?? []).length > 0
                                        ? (supplier.assignedPurchasingSuppliers ?? []).map((user) => getUserDisplayName(user) || user.email).join(", ")
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                                        {supplier.isActive ? "Aktif" : "Pasif"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-neutral-500">
                                    {new Date(supplier.createdAt).toLocaleDateString("tr-TR")}
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <Button
                                        size="sm"
                                        variant={selectedSupplier?.id === supplier.id ? "default" : "outline"}
                                        onClick={() => {
                                            setSelectedSupplier(supplier)
                                            supplierWorkspace.resetForSupplierSelection()
                                        }}
                                        className="gap-2"
                                    >
                                        <Truck className="h-4 w-4" />
                                        Detaylar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="ml-1"
                                        onClick={() => setEditingSupplier(supplier)}
                                    >
                                        Düzenle
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!supplierQuery.isLoading && suppliers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    Tedarikçi bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AdminListPagination
                page={supplierMeta?.page ?? filters.page}
                totalPages={supplierMeta?.totalPages ?? 1}
                total={supplierMeta?.total}
                limit={filters.limit}
                itemLabel="tedarikçi"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />

            {selectedSupplier && (
                <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-neutral-800">
                        <Package className="h-4 w-4" />
                        <h2 className="font-semibold">
                            {selectedSupplier.name} · Ürün Modeli Seçimi
                        </h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => {
                                supplierWorkspace.setSelectedCategoryId(e.target.value)
                            }}
                            className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                        >
                            <option value="">Tüm Kategoriler</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.code} · {category.name}
                                </option>
                            ))}
                        </select>

                        <Input
                            placeholder="Ürün modeli ara..."
                            value={productSearch}
                            onChange={(e) => {
                                supplierWorkspace.setProductSearch(e.target.value)
                            }}
                        />

                        <select
                            value={String(productLimit)}
                            onChange={(e) => {
                                supplierWorkspace.setProductLimit(Number(e.target.value))
                            }}
                            className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                        >
                            <option value="8">8 model / sayfa</option>
                            <option value="12">12 model / sayfa</option>
                            <option value="20">20 model / sayfa</option>
                        </select>
                    </div>

                    <div className="rounded-xl border p-3">
                        {productsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner className="size-5" />
                            </div>
                        ) : products.length === 0 ? (
                            <p className="text-sm text-neutral-500 py-4 text-center">
                                Filtreye uygun ürün modeli bulunamadı.
                            </p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {products.map((product) => {
                                    const primaryAsset = (product.assets ?? []).find((asset) => asset?.role === "PRIMARY") ?? (product.assets ?? [])[0]
                                    const isSelected = selectedProductId === product.id
                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => {
                                                supplierWorkspace.setSelectedProductId(product.id)
                                            }}
                                            className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${isSelected
                                                ? "border-red-400 bg-red-50"
                                                : "hover:border-neutral-300 hover:bg-neutral-50"
                                                }`}
                                        >
                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-white">
                                                {primaryAsset?.url ? (
                                                    <Image
                                                        src={primaryAsset.url}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                                                        Görsel
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs text-neutral-500">{product.code}</p>
                                                <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                                                <p className="truncate text-[11px] text-neutral-500">
                                                    {product.category?.name} · {product.variantCount} varyant
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={(productMeta?.page ?? productPage) <= 1}
                            onClick={() => supplierWorkspace.setProductPage((p) => Math.max(1, p - 1))}
                        >
                            Model Önceki
                        </Button>
                        <span className="text-sm text-neutral-600">
                            Model Sayfa {productMeta?.page ?? productPage} / {productMeta?.totalPages ?? 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={(productMeta?.page ?? productPage) >= (productMeta?.totalPages ?? 1)}
                            onClick={() => supplierWorkspace.setProductPage((p) => p + 1)}
                        >
                            Model Sonraki
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-800 pt-2">
                        <Package className="h-4 w-4" />
                        <h3 className="font-semibold">
                            Varyantlar {selectedProductId ? "· Seçilen Ürün" : ""}
                        </h3>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            placeholder="Varyant ara (kod/ad)..."
                            value={detailSearch}
                            onChange={(e) => {
                                supplierWorkspace.setDetailSearch(e.target.value)
                            }}
                        />
                        <select
                            className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                            value={String(detailLimit)}
                            onChange={(e) => {
                                supplierWorkspace.setDetailLimit(Number(e.target.value))
                            }}
                        >
                            <option value="10">10 varyant / sayfa</option>
                            <option value="20">20 varyant / sayfa</option>
                            <option value="50">50 varyant / sayfa</option>
                        </select>
                    </div>

                    <SupplierBulkPricingForm
                        visible={Boolean(selectedProductId)}
                        isPending={bulkUpdatePricingMutation.isPending}
                        onSubmit={handleBulkPricingSubmit}
                    />

                    <div className="rounded-xl border overflow-hidden">
                        {selectedProduct ? (
                            <div className="border-b bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                                <div>
                                    Seçili model: <span className="font-medium text-neutral-800">{selectedProduct.code} · {selectedProduct.name}</span>
                                </div>
                                <div className="mt-1">
                                    Tedarikçi varsayılan vade:{" "}
                                    <span className="font-medium text-neutral-800">
                                        {selectedSupplier.defaultPaymentTermDays ?? "-"} gün
                                    </span>
                                </div>
                            </div>
                        ) : null}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Varyant Kodu</TableHead>
                                    {/* <TableHead>Varyant Adı</TableHead> */}
                                    <TableHead>Ham Maliyet</TableHead>
                                    <TableHead>Operasyonel %</TableHead>
                                    <TableHead>Net Maliyet</TableHead>
                                    <TableHead>Kâr %</TableHead>
                                    <TableHead>Liste</TableHead>
                                    <TableHead>Vade</TableHead>
                                    <TableHead>Tedarikçi Kodu</TableHead>
                                    <TableHead>Not</TableHead>
                                    <TableHead>Min Sipariş</TableHead>
                                    <TableHead>Stok</TableHead>
                                    <TableHead>Fiyat Güncelleme</TableHead>
                                    <TableHead>Stok Güncelleme</TableHead>
                                    {/* <TableHead>Durum</TableHead> */}
                                    <TableHead className="text-right pr-4">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailQuery.isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={16} className="py-12">
                                            <div className="flex items-center justify-center">
                                                <Spinner className="size-5" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !selectedProductId ? (
                                    <TableRow>
                                        <TableCell colSpan={16} className="py-8 text-center text-sm text-neutral-500">
                                            Önce ürün modeli seçin, ardından bu tedarikçiye ait varyantlar listelensin.
                                        </TableCell>
                                    </TableRow>
                                ) : supplierRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-xs">{row.variant?.fullCode ?? "-"}</TableCell>
                                        {/* <TableCell>{row.variant?.name ?? "-"}</TableCell> */}
                                        <TableCell>
                                            {decimalLikeToFixedText(row.price)} {row.currency ?? "TRY"}
                                        </TableCell>
                                        <TableCell>{decimalLikeToFixedText(row.operationalCostRate) === "-" ? "-" : `%${decimalLikeToFixedText(row.operationalCostRate)}`}</TableCell>
                                        <TableCell>{decimalLikeToFixedText(row.netCost)} {row.currency ?? "TRY"}</TableCell>
                                        <TableCell>{decimalLikeToFixedText(row.profitRate) === "-" ? "-" : `%${decimalLikeToFixedText(row.profitRate)}`}</TableCell>
                                        <TableCell>{decimalLikeToFixedText(row.listPrice)} {row.currency ?? "TRY"}</TableCell>
                                        <TableCell>
                                            {row.paymentTermDays ?? selectedSupplier.defaultPaymentTermDays ?? "-"}
                                        </TableCell>
                                        <TableCell>{row.supplierVariantCode ?? "-"}</TableCell>
                                        <TableCell className="max-w-[220px] truncate" title={row.supplierNote ?? ""}>{row.supplierNote ?? "-"}</TableCell>
                                        <TableCell>{row.minOrderQty ?? "-"}</TableCell>
                                        <TableCell>{row.stockQty ?? "-"}</TableCell>
                                        <TableCell>{row.pricingUpdatedAt ? new Date(row.pricingUpdatedAt).toLocaleString("tr-TR") : "-"}</TableCell>
                                        <TableCell>{row.availabilityUpdatedAt ? new Date(row.availabilityUpdatedAt).toLocaleString("tr-TR") : "-"}</TableCell>
                                        {/* <TableCell>
                                            <Badge variant={row.isActive ? "default" : "secondary"}>
                                                {row.isActive ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </TableCell> */}
                                        <TableCell className="text-right pr-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const variant = variantById.get(row.variantId)
                                                    if (variant) setEditingVariant(variant)
                                                }}
                                                disabled={!variantById.get(row.variantId)}
                                            >
                                                Güncelle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!detailQuery.isLoading && supplierRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={16} className="py-8 text-center text-sm text-neutral-500">
                                            Bu tedarikçiye ait varyant kaydı yok.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" disabled={(supplierRowsMeta?.page ?? detailPage) <= 1} onClick={() => supplierWorkspace.setDetailPage((p) => Math.max(1, p - 1))}>
                            Önceki
                        </Button>
                        <span className="text-sm text-neutral-600">
                            Sayfa {supplierRowsMeta?.page ?? detailPage} / {supplierRowsMeta?.totalPages ?? 1}
                        </span>
                        <Button variant="outline" size="sm" disabled={(supplierRowsMeta?.page ?? detailPage) >= (supplierRowsMeta?.totalPages ?? 1)} onClick={() => supplierWorkspace.setDetailPage((p) => p + 1)}>
                            Sonraki
                        </Button>
                    </div>
                </div>
            )}

            <EditSupplierDialog
                open={Boolean(editingSupplier)}
                supplier={editingSupplier}
                purchasingUserOptions={purchasingUserOptions}
                isPending={updateSupplierMutation.isPending}
                onOpenChange={(next) => {
                    if (!next) setEditingSupplier(null)
                }}
                onSubmit={handleSupplierUpdate}
            />

            {editingVariant && referencesQuery.data ? (
                <CreateVariantDialog
                    mode="edit"
                    open
                    variant={editingVariant}
                    onOpenChange={(next) => {
                        if (!next) {
                            setEditingVariant(null)
                            void detailQuery.refetch()
                            void productVariantsQuery.refetch()
                        }
                    }}
                    productId={editingVariant.productId}
                    productCode={selectedProduct?.code ?? editingVariant.fullCode.split(".").slice(0, 2).join(".")}
                    references={referencesQuery.data}
                />
            ) : null}
        </div>
    )
}
