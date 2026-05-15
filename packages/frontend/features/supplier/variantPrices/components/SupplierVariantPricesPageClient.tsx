"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductVariantsTable } from "@/features/admin/productVariants/components/ProductVariantsTable"
import { useProductListFilters } from "@/features/admin/products/hooks/useProductListFilters"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { CreateSupplierVariantRequestDialog } from "@/features/supplier/businessRequests/components/CreateSupplierVariantRequestDialog"
import { EditSupplierPriceDialog } from "@/features/supplier/variantPrices/components/EditSupplierPriceDialog"
import { useSupplierProducts } from "@/features/supplier/variantPrices/hooks/useSupplierProducts"
import { useSupplierVariantPrices } from "@/features/supplier/variantPrices/hooks/useSupplierVariantPrices"
import type { SupplierVariantPrice } from "@/features/supplier/variantPrices/api/types"
import { WorkspaceProductsTable } from "@/features/workspaceProducts/components/WorkspaceProductsTable"
import { getProductFilterCategories } from "@/features/workspaceProducts/api/getProductFilterCategories"
import type { ProductVariant } from "@/features/admin/productVariants/api/types"

type VariantPricePanelMode = "supplier" | "purchasing" | "sales"
type VariantPriceViewerMode = "full" | "supplier" | "purchasing" | "sales"

type Props = {
    mode?: VariantPricePanelMode
    viewerMode?: VariantPriceViewerMode
}

function sortVariantList(variants: ProductVariant[]) {
    return [...variants].sort((left, right) => {
        const leftMeasurements = [...left.measurements].sort(
            (a, b) => (a.measurementType.displayOrder ?? 0) - (b.measurementType.displayOrder ?? 0),
        )
        const rightMeasurements = [...right.measurements].sort(
            (a, b) => (a.measurementType.displayOrder ?? 0) - (b.measurementType.displayOrder ?? 0),
        )

        const length = Math.max(leftMeasurements.length, rightMeasurements.length)
        for (let index = 0; index < length; index += 1) {
            const leftValue = leftMeasurements[index]?.value ?? 0
            const rightValue = rightMeasurements[index]?.value ?? 0

            if (leftValue !== rightValue) {
                return leftValue - rightValue
            }
        }

        return left.fullCode.localeCompare(right.fullCode, "tr", {
            sensitivity: "base",
            numeric: true,
        })
    })
}

function groupVariantPriceRows(rows: SupplierVariantPrice[]) {
    const variantsById = new Map<string, ProductVariant>()

    for (const row of rows) {
        const variant = row.variant
        if (!variant) continue

        const existing = variantsById.get(variant.id)

        const nextSupplier = {
            id: row.id,
            isActive: row.isActive,
            price: row.price ?? undefined,
            operationalCostRate: row.operationalCostRate ?? undefined,
            netCost: row.netCost ?? undefined,
            profitRate: row.profitRate ?? undefined,
            listPrice: row.listPrice ?? undefined,
            paymentTermDays: row.paymentTermDays,
            supplierVariantCode: row.supplierVariantCode,
            supplierNote: row.supplierNote,
            minOrderQty: row.minOrderQty,
            stockQty: row.stockQty,
            pricingUpdatedAt: row.pricingUpdatedAt,
            availabilityUpdatedAt: row.availabilityUpdatedAt,
            currency: row.currency,
            supplier: {
                id: row.supplier?.id ?? row.supplierId,
                name: row.supplier?.name ?? "Tedarikçi",
            },
        }

        if (existing) {
            existing.variantSuppliers.push(nextSupplier)
            continue
        }

        variantsById.set(variant.id, {
            id: variant.id,
            productId: variant.productId,
            name: variant.name,
            fullCode: variant.fullCode,
            versionCode: variant.fullCode,
            supplierCode: row.supplierVariantCode ?? "",
            variantIndex: 0,
            createdAt: row.createdAt,
            color: variant.color ?? null,
            materials: (variant.materials ?? []).map((material) => ({
                id: material.id,
                name: material.name,
            })),
            measurements: (variant.measurements ?? []).map((measurement) => ({
                id: measurement.id,
                value: measurement.value,
                label: measurement.label,
                measurementType: measurement.measurementType,
            })),
            variantSuppliers: [nextSupplier],
        })
    }

    return sortVariantList(Array.from(variantsById.values()))
}

export function SupplierVariantPricesPageClient({ mode = "supplier", viewerMode }: Props) {
    const [selectedProductId, setSelectedProductId] = useState("")
    const [variantSearch, setVariantSearch] = useState("")
    const [variantPage, setVariantPage] = useState(1)
    const [variantLimit, setVariantLimit] = useState(20)
    const [editingRow, setEditingRow] = useState<SupplierVariantPrice | null>(null)
    const [variantRequestOpen, setVariantRequestOpen] = useState(false)

    const {
        filters,
        params,
        setSearch,
        setCategoryId,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useProductListFilters()

    const endpointPrefix = mode === "sales" ? "sales" : mode === "purchasing" ? "purchasing" : "supplier"
    const effectiveViewerMode: VariantPriceViewerMode =
        viewerMode ?? (mode === "sales" ? "sales" : mode === "purchasing" ? "purchasing" : "supplier")

    const canSeeCost = effectiveViewerMode === "full" || effectiveViewerMode === "purchasing" || effectiveViewerMode === "supplier"
    const canSeeListPrice = effectiveViewerMode === "full" || effectiveViewerMode === "sales"
    const canEdit = effectiveViewerMode !== "sales"
    const allowAdvancedFields = effectiveViewerMode === "full"

    const categoriesQuery = useQuery({
        queryKey: ["workspace-product-filter-categories"],
        queryFn: getProductFilterCategories,
        staleTime: 1000 * 60 * 10,
    })

    const productsQuery = useSupplierProducts({
        endpointPrefix,
        ...params,
        sort: "name",
        order: "asc",
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })

    const variantsQuery = useSupplierVariantPrices(
        {
            endpointPrefix,
            page: 1,
            limit: 500,
            sort: "updatedAt",
            order: "desc",
            productId: selectedProductId || undefined,
            ...(variantSearch.trim() ? { search: variantSearch.trim() } : {}),
        },
        {
            enabled: Boolean(selectedProductId),
            refetchInterval: filters.refreshIntervalSeconds > 0
                ? filters.refreshIntervalSeconds * 1000
                : false,
        },
    )

    const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data?.data])
    const productMeta = productsQuery.data?.meta
    const selectedProduct = products.find((product) => product.id === selectedProductId)
    const groupedVariants = useMemo(
        () => groupVariantPriceRows(variantsQuery.data?.data ?? []),
        [variantsQuery.data?.data],
    )
    const paginatedVariants = useMemo(() => {
        const start = (variantPage - 1) * variantLimit
        return groupedVariants.slice(start, start + variantLimit)
    }, [groupedVariants, variantLimit, variantPage])
    const variantTotalPages = Math.max(1, Math.ceil(groupedVariants.length / variantLimit))

    const selectedProductName = useMemo(() => {
        const selectedProduct = products.find((product) => product.id === selectedProductId)
        if (selectedProduct) return selectedProduct.name

        return variantsQuery.data?.data?.[0]?.variant?.product?.name ?? ""
    }, [products, selectedProductId, variantsQuery.data?.data])

    const productTitle =
        mode === "purchasing"
            ? "Satın Alma Ürünleri"
            : mode === "sales"
                ? "Satış Ürünleri"
                : "Tedarikçi Ürünleri"
    const productDescription =
        mode === "purchasing"
            ? "Tedarikçilerden gelen ürün modellerini admin ekranıyla aynı filtre ve tablo yapısında inceleyin."
            : mode === "sales"
                ? "Satış ekibinin görebildiği ürün modellerini admin ekranına paralel liste yapısıyla yönetin."
                : "Tedarikçinize bağlı ürün modellerini admin ürün ekranıyla aynı iskelette görüntüleyin."

    return (
        <div className="space-y-6">
            <WorkspaceProductsTable
                title={productTitle}
                description={productDescription}
                emptyMessage="Seçilen filtrelere göre ürün bulunamadı."
                products={products}
                meta={productMeta}
                categories={categoriesQuery.data ?? []}
                searchQuery={filters.search}
                onSearchQueryChange={setSearch}
                categoryId={filters.categoryId}
                onCategoryIdChange={(value) => {
                    setCategoryId(value)
                    setSelectedProductId("")
                    setVariantPage(1)
                }}
                page={filters.page}
                onPageChange={setPage}
                limit={filters.limit}
                onLimitChange={setLimit}
                isFetching={productsQuery.isFetching || categoriesQuery.isFetching}
                dataUpdatedAt={productsQuery.dataUpdatedAt}
                onRefresh={() => void productsQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
                selectedProductId={selectedProductId}
                onViewVariants={(productId) => {
                    setSelectedProductId(productId)
                    setVariantPage(1)
                }}
            />

            <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Varyantlar</h2>
                        <p className="text-sm text-neutral-500">
                            {selectedProductId
                                ? `${selectedProductName || "Seçili model"} için varyant detayları`
                                : "Admin varyant ekranına benzer görünümde detayları görmek için ürün modeli seçin."}
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={variantSearch}
                            onChange={(event) => {
                                setVariantSearch(event.target.value)
                                setVariantPage(1)
                            }}
                            placeholder="Varyant kodu veya adı ara"
                            className="pl-9"
                            disabled={!selectedProductId}
                        />
                    </div>
                </div>

                {mode === "supplier" && selectedProductId && selectedProduct ? (
                    <div className="flex justify-end">
                        <Button type="button" onClick={() => setVariantRequestOpen(true)}>
                            Varyant Talebi Aç
                        </Button>
                    </div>
                ) : null}

                {selectedProductId ? (
                    <ProductVariantsTable
                        variants={paginatedVariants}
                        emptyTitle="Varyant bulunamadı"
                        emptyDescription="Seçili ürün modeli için görüntülenecek varyant kaydı yok."
                        pricingVisibility={{
                            showPrice: canSeeCost,
                            showOperationalCostRate: canSeeCost,
                            showNetCost: canSeeCost,
                            showProfitRate: effectiveViewerMode === "full",
                            showListPrice: canSeeListPrice,
                        }}
                        pricingLabels={{
                            price: "Maliyet",
                            operationalCostRate: "Op. Maliyet",
                            netCost: "Net Maliyet",
                            profitRate: "Kâr Oranı",
                            listPrice: "Liste Fiyatı",
                        }}
                        summaryPricingField={canSeeListPrice ? "listPrice" : "netCost"}
                        onEdit={canEdit
                            ? (variant) => {
                                const activeSupplier = variant.variantSuppliers.find((supplier) => supplier.isActive) ?? variant.variantSuppliers[0]
                                const nextRow = variantsQuery.data?.data?.find((row) => row.id === activeSupplier?.id) ?? null
                                setEditingRow(nextRow)
                            }
                            : undefined}
                    />
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center text-sm text-neutral-500">
                        Varyant listesini açmak için yukarıdan bir ürün modeli seçin.
                    </div>
                )}

                {selectedProductId ? (
                    <AdminListPagination
                        page={variantPage}
                        totalPages={variantTotalPages}
                        total={groupedVariants.length}
                        limit={variantLimit}
                        itemLabel="varyant"
                        onPageChange={setVariantPage}
                        onLimitChange={(nextLimit) => {
                            setVariantLimit(nextLimit)
                            setVariantPage(1)
                        }}
                    />
                ) : null}
            </div>

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

            {mode === "supplier" && selectedProductId && selectedProduct ? (
                <CreateSupplierVariantRequestDialog
                    open={variantRequestOpen}
                    onOpenChange={setVariantRequestOpen}
                    productId={selectedProduct.id}
                    productCode={selectedProduct.code}
                    productName={selectedProduct.name}
                />
            ) : null}
        </div>
    )
}
