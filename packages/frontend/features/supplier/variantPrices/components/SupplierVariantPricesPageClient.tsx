"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Building2, Filter, Pencil, Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { publicApiClient } from "@/lib/http/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"
import { DashboardWithCollapsibleSidebar } from "@/components/ui/dashboard-with-collapsible-sidebar"
import { EditSupplierPriceDialog } from "@/features/supplier/variantPrices/components/EditSupplierPriceDialog"
import { EditSupplierProfileDialog } from "@/features/supplier/variantPrices/components/EditSupplierProfileDialog"
import { useSupplierProfile } from "@/features/supplier/variantPrices/hooks/useSupplierProfile"
import { useSupplierProducts } from "@/features/supplier/variantPrices/hooks/useSupplierProducts"
import { useSupplierVariantPrices } from "@/features/supplier/variantPrices/hooks/useSupplierVariantPrices"
import { useUpdateSupplierProfile } from "@/features/supplier/variantPrices/hooks/useUpdateSupplierProfile"
import type { SupplierVariantPrice } from "@/features/supplier/variantPrices/api/types"
import type { Category } from "@/features/public/categories/types"
import type { ListCategoriesResponse } from "@/features/public/categories/api/types"

type VariantPricePanelMode = "supplier" | "purchasing" | "sales"
type VariantPriceViewerMode = "full" | "supplier" | "purchasing" | "sales"

type Props = {
    mode?: VariantPricePanelMode
    viewerMode?: VariantPriceViewerMode
}

async function fetchCategoriesForFilter() {
    const res = await publicApiClient.get<ListCategoriesResponse>("/categories", {
        params: { page: 1, limit: 500, sort: "name", order: "asc" },
    })
    return res.data.payload.data as Category[]
}

function decimalLikeToText(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    if (value === null || value === undefined) return "-"
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed.toFixed(2) : value
    }
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

function formatDate(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date)
}

export function SupplierVariantPricesPageClient({ mode = "supplier", viewerMode }: Props) {
    const [categoryId, setCategoryId] = useState("")
    const [productSearch, setProductSearch] = useState("")
    const [productPage, setProductPage] = useState(1)
    const [productLimit, setProductLimit] = useState(12)
    const [selectedProductId, setSelectedProductId] = useState("")

    const [variantSearch, setVariantSearch] = useState("")
    const [variantPage, setVariantPage] = useState(1)
    const [variantLimit, setVariantLimit] = useState(20)
    const [editingRow, setEditingRow] = useState<SupplierVariantPrice | null>(null)
    const [profileDialogOpen, setProfileDialogOpen] = useState(false)

    const effectiveViewerMode: VariantPriceViewerMode =
        viewerMode ?? (mode === "sales" ? "sales" : mode === "purchasing" ? "purchasing" : "supplier")

    const canSeeCost = effectiveViewerMode === "full" || effectiveViewerMode === "purchasing" || effectiveViewerMode === "supplier"
    const canSeeProfitRate = effectiveViewerMode === "full"
    const canSeeListPrice = effectiveViewerMode === "full" || effectiveViewerMode === "sales"
    const canEdit = effectiveViewerMode !== "sales"
    const allowAdvancedFields = effectiveViewerMode === "full"

    const categoriesQuery = useQuery({
        queryKey: ["supplier-panel-categories"],
        queryFn: fetchCategoriesForFilter,
        staleTime: 1000 * 60 * 10,
    })

    const isSupplierMode = mode === "supplier"
    const profileQuery = useSupplierProfile("supplier", isSupplierMode)
    const updateProfileMutation = useUpdateSupplierProfile()

    const productsQuery = useSupplierProducts({
        endpointPrefix: mode === "sales" ? "sales" : mode === "purchasing" ? "purchasing" : "supplier",
        page: productPage,
        limit: productLimit,
        ...(categoryId ? { categoryId } : {}),
        ...(productSearch.trim() ? { search: productSearch.trim() } : {}),
        sort: "name",
        order: "asc",
    })

    const variantsQuery = useSupplierVariantPrices({
        endpointPrefix: mode === "sales" ? "sales" : mode === "purchasing" ? "purchasing" : "supplier",
        page: variantPage,
        limit: variantLimit,
        sort: "updatedAt",
        order: "desc",
        ...(selectedProductId ? { productId: selectedProductId } : {}),
        ...(variantSearch.trim() ? { search: variantSearch.trim() } : {}),
    })

    const panelTitle =
        mode === "purchasing"
            ? "Satın Alma"
            : mode === "sales"
                ? "Satış"
                : profileQuery.data?.name ?? "Tedarikçi"
    const sortedCategories = useMemo(
        () =>
            [...(categoriesQuery.data ?? [])].sort((a, b) =>
                `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`, "tr", {
                    sensitivity: "base",
                    numeric: true,
                })
            ),
        [categoriesQuery.data]
    )
    const products = productsQuery.data?.data
    const productMeta = productsQuery.data?.meta
    const rows = selectedProductId ? (variantsQuery.data?.data ?? []) : []
    const variantsMeta = variantsQuery.data?.meta

    const selectedProductName = useMemo(
        () => (products ?? []).find((product) => product.id === selectedProductId)?.name ?? "",
        [products, selectedProductId]
    )

    const profile = profileQuery.data

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
                            <Building2 className="h-3.5 w-3.5" />
                            {mode === "supplier" ? "Tedarikçi Paneli" : mode === "purchasing" ? "Satın Alma Paneli" : "Satış Paneli"}
                        </div>
                        <h1 className="text-2xl font-semibold text-neutral-900">{panelTitle}</h1>
                        <p className="text-sm text-neutral-500">
                            {isSupplierMode && profileQuery.data?.contactName
                                ? `Yetkili: ${profileQuery.data.contactName}`
                                : "Varyant maliyet, kâr ve liste fiyat verilerini inceleyin."}
                        </p>
                        {isSupplierMode ? (
                            <>
                                <div className="flex flex-wrap gap-3 pt-1 text-xs text-neutral-500">
                                    {profileQuery.data?.phone ? <span>Telefon: {profileQuery.data.phone}</span> : null}
                                    {profileQuery.data?.taxNumber ? <span>Vergi No: {profileQuery.data.taxNumber}</span> : null}
                                    {profileQuery.data?.defaultPaymentTermDays !== null && profileQuery.data?.defaultPaymentTermDays !== undefined ? (
                                        <span>Varsayılan Vade: {profileQuery.data.defaultPaymentTermDays} gün</span>
                                    ) : null}
                                    {profileQuery.data?.address ? <span>Adres: {profileQuery.data.address}</span> : null}
                                </div>
                                <div className="pt-2">
                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setProfileDialogOpen(true)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                        Tedarikçi Bilgilerini Düzenle
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border bg-neutral-50 px-3 py-2 text-center">
                            <p className="text-[11px] text-neutral-500">Model</p>
                            <p className="text-base font-semibold text-neutral-800"><AnimatedCounter value={productsQuery.data?.meta.total ?? 0} /></p>
                        </div>
                        <div className="rounded-lg border bg-neutral-50 px-3 py-2 text-center">
                            <p className="text-[11px] text-neutral-500">Varyant</p>
                            <p className="text-base font-semibold text-neutral-800"><AnimatedCounter value={variantsMeta?.total ?? 0} /></p>
                        </div>
                        <div className="rounded-lg border bg-neutral-50 px-3 py-2 text-center">
                            <p className="text-[11px] text-neutral-500">Aktif</p>
                            <p className="text-base font-semibold text-neutral-800"><AnimatedCounter value={rows.filter((row) => row.isActive).length} /></p>
                        </div>
                    </div>
                </div>
            </div>

            <DashboardWithCollapsibleSidebar
                sidebar={
                    <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <Filter className="h-4 w-4" />
                        Ürün Modeli Filtreleri
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Kategori</label>
                        <select
                            value={categoryId}
                            onChange={(e) => {
                                setCategoryId(e.target.value)
                                setSelectedProductId("")
                                setProductPage(1)
                                setVariantPage(1)
                            }}
                            className="h-9 w-full rounded-md border border-neutral-200 px-2 text-sm"
                        >
                            <option value="">Tüm Kategoriler</option>
                            {sortedCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.code} · {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Model Ara</label>
                        <Input
                            placeholder="Kod veya ad..."
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value)
                                setProductPage(1)
                            }}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Sayfa Başına Model Sayısı</label>
                        <select
                            value={String(productLimit)}
                            onChange={(e) => {
                                setProductLimit(Number(e.target.value))
                                setProductPage(1)
                            }}
                            className="h-9 w-full rounded-md border border-neutral-200 px-2 text-sm"
                        >
                            <option value="8">8</option>
                            <option value="12">12</option>
                            <option value="20">20</option>
                        </select>
                    </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-neutral-800">Ürün Modelleri</h2>
                            <div className="text-xs text-neutral-500">
                                Sayfa {productMeta?.page ?? productPage} / {productMeta?.totalPages ?? 1}
                            </div>
                        </div>

                        {productsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner className="size-5" />
                            </div>
                        ) : (products ?? []).length === 0 ? (
                            <p className="py-6 text-center text-sm text-neutral-500">Bu tedarikçide eşleşen ürün modeli bulunamadı.</p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {(products ?? []).map((product) => {
                                    const primaryAsset = (product.assets ?? []).find((asset) => asset?.role === "PRIMARY") ?? (product.assets ?? [])[0]
                                    const selected = selectedProductId === product.id
                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedProductId(product.id)
                                                setVariantPage(1)
                                            }}
                                            className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${
                                                selected ? "border-brand bg-brand/5" : "hover:border-neutral-300 hover:bg-neutral-50"
                                            }`}
                                        >
                                            <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-white">
                                                {primaryAsset?.url ? (
                                                    <Image src={primaryAsset.url} alt={product.name} fill className="object-cover" sizes="48px" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">Görsel</div>
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

                        <div className="mt-3 flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(productMeta?.page ?? productPage) <= 1}
                                onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                            >
                                Önceki
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(productMeta?.page ?? productPage) >= (productMeta?.totalPages ?? 1)}
                                onClick={() => setProductPage((p) => p + 1)}
                            >
                                Sonraki
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-800">Varyantlar</h3>
                                <p className="text-xs text-neutral-500">
                                    {selectedProductId ? `${selectedProductName} modeli varyantları` : "Önce bir ürün modeli seçin"}
                                </p>
                            </div>
                            <div className="relative w-full max-w-xs">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    value={variantSearch}
                                    onChange={(e) => {
                                        setVariantSearch(e.target.value)
                                        setVariantPage(1)
                                    }}
                                    placeholder="Varyant kod/ad..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {selectedProductId && variantsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner className="size-5" />
                            </div>
                        ) : !selectedProductId ? (
                            <p className="py-8 text-center text-sm text-neutral-500">Varyantları görmek için ürün modeli seçin.</p>
                        ) : rows.length === 0 ? (
                            <p className="py-8 text-center text-sm text-neutral-500">Bu model için varyant kaydı bulunamadı.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-neutral-50 text-left text-xs text-neutral-600">
                                            <th className="px-3 py-2">Varyant</th>
                                            {canSeeCost ? <th className="px-3 py-2">Maliyet</th> : null}
                                            {canSeeProfitRate ? <th className="px-3 py-2">Kâr %</th> : null}
                                            {canSeeListPrice ? <th className="px-3 py-2">Liste Fiyatı</th> : null}
                                            <th className="px-3 py-2">Min Sipariş</th>
                                            <th className="px-3 py-2">Stok</th>
                                            <th className="px-3 py-2">Fiyat Güncelleme</th>
                                            <th className="px-3 py-2">Stok Güncelleme</th>
                                            <th className="px-3 py-2">Durum</th>
                                            {canEdit ? <th className="px-3 py-2 text-right">İşlem</th> : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.id} className="border-b last:border-0">
                                                <td className="px-3 py-2">
                                                    <p className="font-mono text-xs text-neutral-500">{row.variant?.fullCode ?? "-"}</p>
                                                    <p className="font-medium text-neutral-800">{row.variant?.name ?? "-"}</p>
                                                </td>
                                                {canSeeCost ? <td className="px-3 py-2">{decimalLikeToText(row.price)} {row.currency ?? "TRY"}</td> : null}
                                                {canSeeProfitRate ? <td className="px-3 py-2">{decimalLikeToText(row.profitRate)}</td> : null}
                                                {canSeeListPrice ? <td className="px-3 py-2">{decimalLikeToText(row.listPrice)} {row.currency ?? "TRY"}</td> : null}
                                                <td className="px-3 py-2">{row.minOrderQty ?? "-"}</td>
                                                <td className="px-3 py-2">{row.stockQty ?? "-"}</td>
                                                <td className="px-3 py-2">{formatDate(row.pricingUpdatedAt)}</td>
                                                <td className="px-3 py-2">{formatDate(row.availabilityUpdatedAt)}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                                                        {row.isActive ? "Aktif" : "Pasif"}
                                                    </span>
                                                </td>
                                                {canEdit ? (
                                                    <td className="px-3 py-2 text-right">
                                                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingRow(row)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Düzenle
                                                        </Button>
                                                    </td>
                                                ) : null}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(variantsMeta?.page ?? variantPage) <= 1}
                                onClick={() => setVariantPage((p) => Math.max(1, p - 1))}
                            >
                                Önceki
                            </Button>
                            <span className="text-xs text-neutral-500">
                                Sayfa {variantsMeta?.page ?? variantPage} / {variantsMeta?.totalPages ?? 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(variantsMeta?.page ?? variantPage) >= (variantsMeta?.totalPages ?? 1)}
                                onClick={() => setVariantPage((p) => p + 1)}
                            >
                                Sonraki
                            </Button>
                            <select
                                className="ml-2 h-8 rounded-md border border-neutral-200 px-2 text-sm"
                                value={String(variantLimit)}
                                onChange={(e) => {
                                    setVariantLimit(Number(e.target.value))
                                    setVariantPage(1)
                                }}
                            >
                                <option value="10">10 / sayfa</option>
                                <option value="20">20 / sayfa</option>
                                <option value="50">50 / sayfa</option>
                            </select>
                        </div>
                    </div>
                </div>
            </DashboardWithCollapsibleSidebar>

            {canEdit ? (
                <EditSupplierPriceDialog
                    open={Boolean(editingRow)}
                    onOpenChange={(next) => {
                        if (!next) setEditingRow(null)
                    }}
                    row={editingRow}
                    endpointPrefix={mode === "purchasing" ? "purchasing" : "supplier"}
                    allowAdvancedFields={allowAdvancedFields}
                />
            ) : null}

            {isSupplierMode ? (
                <EditSupplierProfileDialog
                    open={profileDialogOpen}
                    onOpenChange={setProfileDialogOpen}
                    profile={profile}
                    isPending={updateProfileMutation.isPending}
                    onSubmit={async (values) => {
                        await updateProfileMutation.mutateAsync(values)
                    }}
                />
            ) : null}
        </div>
    )
}
