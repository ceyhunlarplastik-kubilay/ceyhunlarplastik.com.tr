"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Package, Search, Truck } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import { useSupplierVariantSuppliers } from "@/features/admin/suppliers/hooks/useSupplierVariantSuppliers"
import { useSupplierProducts } from "@/features/admin/suppliers/hooks/useSupplierProducts"
import { useUpdateSupplier } from "@/features/admin/suppliers/hooks/useUpdateSupplier"
import { useBulkUpdateSupplierVariantPricing } from "@/features/admin/suppliers/hooks/useBulkUpdateSupplierVariantPricing"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import { useCategories } from "@/features/admin/categories/hooks/useCategories"
import { CreateVariantDialog } from "@/features/admin/productVariants/components/CreateVariantDialog"
import { useVariantReferences } from "@/features/admin/productVariants/hooks/useVariantReferences"
import { useProductVariants } from "@/features/admin/productVariants/hooks/useProductVariants"
import type { ProductVariant } from "@/features/admin/productVariants/api/types"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

function decimalLikeToText(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    if (value === null || value === undefined) return "-"
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") return value
    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return "-"
    if (exponent >= digits.length - 1) {
        return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    }
    if (exponent < 0) {
        return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    }
    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
}

export function SuppliersPageClient() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [supplierDraft, setSupplierDraft] = useState({
        name: "",
        contactName: "",
        phone: "",
        address: "",
        taxNumber: "",
        defaultPaymentTermDays: "",
    })
    const [selectedCategoryId, setSelectedCategoryId] = useState("")
    const [productSearch, setProductSearch] = useState("")
    const [productPage, setProductPage] = useState(1)
    const [productLimit, setProductLimit] = useState(12)
    const [selectedProductId, setSelectedProductId] = useState("")

    const [detailSearch, setDetailSearch] = useState("")
    const [detailPage, setDetailPage] = useState(1)
    const [detailLimit, setDetailLimit] = useState(20)
    const [bulkOperationalRate, setBulkOperationalRate] = useState("")
    const [bulkProfitRate, setBulkProfitRate] = useState("")
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)

    const supplierParams = useMemo(
        () => ({
            page,
            limit,
            ...(search.trim() ? { search: search.trim() } : {}),
        }),
        [page, limit, search]
    )

    const supplierQuery = useSuppliers(supplierParams)
    const updateSupplierMutation = useUpdateSupplier()
    const bulkUpdatePricingMutation = useBulkUpdateSupplierVariantPricing()
    const referencesQuery = useVariantReferences()
    const categoriesQuery = useCategories()
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
    const categories = categoriesQuery.data ?? []
    const products = productsQuery.data?.data ?? []
    const productMeta = productsQuery.data?.meta
    const supplierRows = detailQuery.data?.data ?? []
    const supplierRowsMeta = detailQuery.data?.meta
    const selectedProduct = products.find((product) => product.id === selectedProductId)
    const variantById = useMemo(
        () => new Map((productVariantsQuery.data ?? []).map((variant) => [variant.id, variant])),
        [productVariantsQuery.data]
    )

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tedarikçiler</h1>
                <p className="text-neutral-500 text-sm">
                    Tedarikçileri listeleyin, seçin ve seçilen tedarikçiye bağlı varyant/fiyat kayıtlarını inceleyin.
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    placeholder="Tedarikçi ara..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="pl-9"
                />
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tedarikçi</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Oluşturma</TableHead>
                            <TableHead className="text-right pr-4">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {supplierQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
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
                                            setSelectedCategoryId("")
                                            setProductSearch("")
                                            setSelectedProductId("")
                                            setProductPage(1)
                                            setDetailPage(1)
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
                                        onClick={() => {
                                            setEditingSupplier(supplier)
                                            setSupplierDraft({
                                                name: supplier.name ?? "",
                                                contactName: supplier.contactName ?? "",
                                                phone: supplier.phone ?? "",
                                                address: supplier.address ?? "",
                                                taxNumber: supplier.taxNumber ?? "",
                                                defaultPaymentTermDays:
                                                    supplier.defaultPaymentTermDays !== null &&
                                                        supplier.defaultPaymentTermDays !== undefined
                                                        ? String(supplier.defaultPaymentTermDays)
                                                        : "",
                                            })
                                        }}
                                    >
                                        Düzenle
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!supplierQuery.isLoading && suppliers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-sm text-neutral-500">
                                    Tedarikçi bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" disabled={(supplierMeta?.page ?? page) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Önceki
                </Button>
                <span className="text-sm text-neutral-600">
                    Sayfa {supplierMeta?.page ?? page} / {supplierMeta?.totalPages ?? 1}
                </span>
                <Button variant="outline" size="sm" disabled={(supplierMeta?.page ?? page) >= (supplierMeta?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
                    Sonraki
                </Button>
                <select
                    className="ml-2 h-8 rounded-md border border-neutral-200 px-2 text-sm"
                    value={String(limit)}
                    onChange={(e) => {
                        setLimit(Number(e.target.value))
                        setPage(1)
                    }}
                >
                    <option value="10">10 / sayfa</option>
                    <option value="20">20 / sayfa</option>
                    <option value="50">50 / sayfa</option>
                </select>
            </div>

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
                                setSelectedCategoryId(e.target.value)
                                setSelectedProductId("")
                                setProductPage(1)
                                setDetailPage(1)
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
                                setProductSearch(e.target.value)
                                setSelectedProductId("")
                                setProductPage(1)
                            }}
                        />

                        <select
                            value={String(productLimit)}
                            onChange={(e) => {
                                setProductLimit(Number(e.target.value))
                                setProductPage(1)
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
                                                setSelectedProductId(product.id)
                                                setDetailPage(1)
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
                            onClick={() => setProductPage((p) => Math.max(1, p - 1))}
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
                            onClick={() => setProductPage((p) => p + 1)}
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
                                setDetailSearch(e.target.value)
                                setDetailPage(1)
                            }}
                        />
                        <select
                            className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                            value={String(detailLimit)}
                            onChange={(e) => {
                                setDetailLimit(Number(e.target.value))
                                setDetailPage(1)
                            }}
                        >
                            <option value="10">10 varyant / sayfa</option>
                            <option value="20">20 varyant / sayfa</option>
                            <option value="50">50 varyant / sayfa</option>
                        </select>
                    </div>

                    {selectedProductId && (
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            <div className="mb-2 text-sm font-medium text-neutral-800">
                                Seçili modelde toplu oran güncelle
                            </div>
                            <div className="grid gap-2 md:grid-cols-4">
                                <Input
                                    inputMode="decimal"
                                    placeholder="Operasyonel Maliyet %"
                                    value={bulkOperationalRate}
                                    onChange={(e) => setBulkOperationalRate(e.target.value.replace(",", "."))}
                                />
                                <Input
                                    inputMode="decimal"
                                    placeholder="Kâr Oranı %"
                                    value={bulkProfitRate}
                                    onChange={(e) => setBulkProfitRate(e.target.value.replace(",", "."))}
                                />
                                <div className="md:col-span-2">
                                    <Button
                                        className="w-full"
                                        disabled={bulkUpdatePricingMutation.isPending}
                                        onClick={async () => {
                                            const parsedOperational = bulkOperationalRate
                                                ? Number(bulkOperationalRate)
                                                : undefined
                                            const parsedProfit = bulkProfitRate ? Number(bulkProfitRate) : undefined

                                            if (
                                                parsedOperational === undefined &&
                                                parsedProfit === undefined
                                            ) {
                                                return
                                            }

                                            await bulkUpdatePricingMutation.mutateAsync({
                                                productId: selectedProductId,
                                                supplierId: selectedSupplier.id,
                                                ...(parsedOperational !== undefined && Number.isFinite(parsedOperational)
                                                    ? { operationalCostRate: parsedOperational }
                                                    : {}),
                                                ...(parsedProfit !== undefined && Number.isFinite(parsedProfit)
                                                    ? { profitRate: parsedProfit }
                                                    : {}),
                                            })
                                            await detailQuery.refetch()
                                            await productVariantsQuery.refetch()
                                        }}
                                    >
                                        {bulkUpdatePricingMutation.isPending ? "Güncelleniyor..." : "Seçili Modelde Toplu Güncelle"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            {decimalLikeToText(row.price)} {row.currency ?? "TRY"}
                                        </TableCell>
                                        <TableCell>{decimalLikeToText(row.operationalCostRate)}</TableCell>
                                        <TableCell>{decimalLikeToText(row.netCost)} {row.currency ?? "TRY"}</TableCell>
                                        <TableCell>{decimalLikeToText(row.profitRate)}</TableCell>
                                        <TableCell>{decimalLikeToText(row.listPrice)} {row.currency ?? "TRY"}</TableCell>
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
                        <Button variant="outline" size="sm" disabled={(supplierRowsMeta?.page ?? detailPage) <= 1} onClick={() => setDetailPage((p) => Math.max(1, p - 1))}>
                            Önceki
                        </Button>
                        <span className="text-sm text-neutral-600">
                            Sayfa {supplierRowsMeta?.page ?? detailPage} / {supplierRowsMeta?.totalPages ?? 1}
                        </span>
                        <Button variant="outline" size="sm" disabled={(supplierRowsMeta?.page ?? detailPage) >= (supplierRowsMeta?.totalPages ?? 1)} onClick={() => setDetailPage((p) => p + 1)}>
                            Sonraki
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={Boolean(editingSupplier)} onOpenChange={(next) => !next && setEditingSupplier(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tedarikçi Bilgileri</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="supplier-name">Firma Adı</Label>
                            <Input
                                id="supplier-name"
                                placeholder="Firma Adı"
                                value={supplierDraft.name}
                                onChange={(e) => setSupplierDraft((p) => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="supplier-contact-name">Yetkili Adı</Label>
                            <Input
                                id="supplier-contact-name"
                                placeholder="Yetkili Adı"
                                value={supplierDraft.contactName}
                                onChange={(e) => setSupplierDraft((p) => ({ ...p, contactName: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="supplier-phone">Telefon</Label>
                            <Input
                                id="supplier-phone"
                                placeholder="Telefon"
                                value={supplierDraft.phone}
                                onChange={(e) => setSupplierDraft((p) => ({ ...p, phone: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="supplier-tax-number">Vergi No</Label>
                            <Input
                                id="supplier-tax-number"
                                placeholder="Vergi No"
                                value={supplierDraft.taxNumber}
                                onChange={(e) => setSupplierDraft((p) => ({ ...p, taxNumber: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="supplier-address">Adres</Label>
                            <Input
                                id="supplier-address"
                                placeholder="Adres"
                                value={supplierDraft.address}
                                onChange={(e) => setSupplierDraft((p) => ({ ...p, address: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="supplier-default-payment-term">Varsayılan Vade (Gün)</Label>
                            <Input
                                id="supplier-default-payment-term"
                                type="number"
                                min={0}
                                placeholder="Varsayılan Vade (Gün)"
                                value={supplierDraft.defaultPaymentTermDays}
                                onChange={(e) => setSupplierDraft((p) => ({ ...p, defaultPaymentTermDays: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={async () => {
                                    if (!editingSupplier) return
                                    await updateSupplierMutation.mutateAsync({
                                        id: editingSupplier.id,
                                        name: supplierDraft.name.trim(),
                                        contactName: supplierDraft.contactName.trim() || undefined,
                                        phone: supplierDraft.phone.trim() || undefined,
                                        taxNumber: supplierDraft.taxNumber.trim() || undefined,
                                        address: supplierDraft.address.trim() || undefined,
                                        defaultPaymentTermDays: supplierDraft.defaultPaymentTermDays
                                            ? Number(supplierDraft.defaultPaymentTermDays)
                                            : undefined,
                                    })
                                    setEditingSupplier(null)
                                }}
                                disabled={updateSupplierMutation.isPending}
                            >
                                {updateSupplierMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
