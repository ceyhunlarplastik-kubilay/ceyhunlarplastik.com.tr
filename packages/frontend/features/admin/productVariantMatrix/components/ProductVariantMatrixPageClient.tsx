"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ArrowLeft, Loader2, Plus, Ruler, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { getProduct } from "@/features/admin/products/api/getProduct"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { MeasurementRequirementsDialog } from "@/features/admin/productMeasurementRequirements/components/MeasurementRequirementsDialog"
import { VariantCodeStatusCard } from "@/features/admin/productVariantMatrix/components/VariantCodeStatusCard"
import { VariantMatrixDraftRow } from "@/features/admin/productVariantMatrix/components/VariantMatrixDraftRow"
import { VariantMatrixExistingTable } from "@/features/admin/productVariantMatrix/components/VariantMatrixExistingTable"
import { VariantMatrixFilters } from "@/features/admin/productVariantMatrix/components/VariantMatrixFilters"
import { VariantMatrixProductCard } from "@/features/admin/productVariantMatrix/components/VariantMatrixProductCard"
import { useVariantMatrixFilters } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixFilters"
import { useSaveVariantMatrix } from "@/features/admin/productVariantMatrix/hooks/useSaveVariantMatrix"
import { useVariantMatrix } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrix"
import {
    useRenumberVariantCodes,
    useSetVariantCodeLock,
} from "@/features/admin/productVariantMatrix/hooks/useVariantCodeActions"
import { useVariantMatrixReferences } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixReferences"
import { buildSaveRows } from "@/features/admin/productVariantMatrix/utils/buildSaveRows"
import { buildDraftFromRow } from "@/features/admin/productVariantMatrix/utils/buildDraftFromRow"
import { filterVariantRows, paginateVariantRows } from "@/features/admin/productVariantMatrix/utils/filterVariantRows"
import {
    createEmptyDraftRow,
    type VariantMatrixDraftRow as DraftRow,
} from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"
import type { MatrixRow, MatrixRowSupplier } from "@/features/admin/productVariantMatrix/api/types"

type Props = {
    productId: string
    /** Ürün listesine dönüş yolu — panel bazında değişir. */
    productsBasePath: string
    /** Kilit/yeniden numaralandırma yalnız yöneticide açık. */
    canManageCodes: boolean
}

export function ProductVariantMatrixPageClient({ productId, productsBasePath, canManageCodes }: Props) {
    const { data: matrix, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useVariantMatrix(productId)
    const {
        filters,
        hasActiveFilters,
        setQuery,
        setSupplierId,
        setColorId,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
        clearFilters,
    } = useVariantMatrixFilters()

    // Ürün görseli ve teknik resmi matris ucunda YOK; mevcut ürün ucundan alınır.
    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ["admin-product", productId],
        queryFn: () => getProduct({ id: productId }),
        enabled: Boolean(productId),
    })
    const { data: references, isError: referencesError } = useVariantMatrixReferences()
    const saveMutation = useSaveVariantMatrix(productId)
    const lockMutation = useSetVariantCodeLock(productId)
    const renumberMutation = useRenumberVariantCodes(productId)

    const [drafts, setDrafts] = useState<DraftRow[]>([])
    const [pinnedSupplierId, setPinnedSupplierId] = useState<string>("")
    const [requirementsOpen, setRequirementsOpen] = useState(false)

    const requirements = matrix?.requirements ?? []
    const colors = references?.colors ?? []
    const materials = references?.materials ?? []
    const suppliers = references?.suppliers ?? []

    const validation = useMemo(() => {
        if (drafts.length === 0 || requirements.length === 0) {
            return { rows: [], errors: [] as Array<{ index: number; message: string }> }
        }
        return buildSaveRows({ rows: drafts, requirements, productName: matrix?.product.name ?? "" })
    }, [drafts, requirements, matrix?.product.name])

    const visibleRows = useMemo(() => {
        if (!matrix) return { pageRows: [], total: 0, totalPages: 1, page: 1, filteredCount: 0 }

        const filtered = filterVariantRows({
            rows: matrix.rows,
            sizes: matrix.sizes,
            versions: matrix.versions,
            filters: { q: filters.q, supplierId: filters.supplierId, colorId: filters.colorId },
        })
        return { ...paginateVariantRows(filtered, filters.page, filters.limit), filteredCount: filtered.length }
    }, [matrix, filters.q, filters.supplierId, filters.colorId, filters.page, filters.limit])

    const duplicateToDraft = (row: MatrixRow, supplier?: MatrixRowSupplier) => {
        if (!matrix) return
        setDrafts((current) => [
            ...current,
            buildDraftFromRow({ row, sizes: matrix.sizes, versions: matrix.versions, supplier }),
        ])
    }

    const errorsByIndex = useMemo(() => {
        const map = new Map<number, string[]>()
        for (const error of validation.errors) {
            map.set(error.index, [...(map.get(error.index) ?? []), error.message])
        }
        return map
    }, [validation.errors])

    const addRow = () => {
        setDrafts((current) => [
            ...current,
            createEmptyDraftRow({ supplierId: pinnedSupplierId || undefined }),
        ])
    }

    const handleSave = async () => {
        if (validation.errors.length > 0 || validation.rows.length === 0) return
        await saveMutation.mutateAsync(validation.rows)
        setDrafts([])
    }

    if (isLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (isError || !matrix) {
        return <div className="p-6 text-sm text-red-600">Varyant matrisi yüklenemedi.</div>
    }

    const hasTemplate = requirements.length > 0

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href={productsBasePath}>
                        <ArrowLeft className="mr-1 size-4" />
                        Ürünler
                    </Link>
                </Button>

                <Button variant="outline" onClick={() => setRequirementsOpen(true)}>
                    <Ruler className="mr-2 size-4" />
                    Ölçü şablonu
                    <Badge variant="secondary" className="ml-2">{requirements.length}</Badge>
                </Button>
            </div>

            <VariantMatrixProductCard
                code={matrix.product.code}
                name={matrix.product.name}
                categoryName={(product as { category?: { name?: string } } | undefined)?.category?.name ?? null}
                assets={(product as { assets?: Array<{ role?: string; type?: string; url?: string }> } | undefined)?.assets ?? []}
                requirementCount={requirements.length}
                variantCount={matrix.rows.length}
                isLocked={Boolean(matrix.product.variantCodesLockedAt)}
                isLoading={productLoading}
            />

            <VariantCodeStatusCard
                lockedAt={matrix.product.variantCodesLockedAt}
                canManageCodes={canManageCodes}
                isLockPending={lockMutation.isPending}
                isRenumberPending={renumberMutation.isPending}
                onToggleLock={(locked) => lockMutation.mutate(locked)}
                onRenumber={() => renumberMutation.mutate()}
            />

            {referencesError ? (
                <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <p className="font-medium">Renk, hammadde ve tedarikçi listeleri yüklenemedi.</p>
                        <p>
                            Satır girişi yapılabilir ama bu alanların açılır listeleri boş kalır.
                            Sayfayı yenileyin; sorun sürerse yetkiniz veya bağlantınız kontrol edilmeli.
                        </p>
                    </div>
                </div>
            ) : null}

            {!hasTemplate ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                    Bu ürün modeli için ölçü şablonu tanımlanmamış. Varyant girebilmek için önce
                    <Button
                        variant="link"
                        className="h-auto px-1 py-0"
                        onClick={() => setRequirementsOpen(true)}
                    >
                        ölçü şablonunu
                    </Button>
                    tanımlayın.
                </div>
            ) : null}

            <section className="space-y-3">
                <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Kayıtlı varyantlar ({matrix.rows.length})
                </h2>

                <VariantMatrixFilters
                    query={filters.q}
                    onQueryChange={setQuery}
                    supplierId={filters.supplierId}
                    onSupplierIdChange={setSupplierId}
                    colorId={filters.colorId}
                    onColorIdChange={setColorId}
                    suppliers={suppliers}
                    colors={colors}
                    hasActiveFilters={hasActiveFilters}
                    onClear={clearFilters}
                    resultCount={visibleRows.filteredCount}
                />

                <AdminListRefreshBar
                    dataUpdatedAt={dataUpdatedAt}
                    isFetching={isFetching}
                    onRefresh={() => void refetch()}
                    refreshIntervalSeconds={filters.refreshIntervalSeconds}
                    onRefreshIntervalChange={setRefreshIntervalSeconds}
                />

                {/* Arka plan yenilemesinde içerik ekranda kalır, üstüne bölüm-yerel
                    katman biner (AGENTS.md refetch-feedback deseni). */}
                <div className="relative" aria-busy={isFetching}>
                    <AdminSectionLoadingOverlay isVisible={isFetching && !isLoading} />
                    <VariantMatrixExistingTable
                        productId={productId}
                        rows={visibleRows.pageRows}
                        sizes={matrix.sizes}
                        versions={matrix.versions}
                        requirements={requirements}
                        colors={colors}
                        materials={materials}
                        supplierCodes={matrix.supplierCodes}
                        onDuplicateToDraft={duplicateToDraft}
                        emptyMessage={
                            hasActiveFilters
                                ? "Filtreye uyan varyant yok. Yukarıdaki filtreleri temizleyerek tümünü görebilirsiniz."
                                : undefined
                        }
                    />
                </div>

                {visibleRows.total > 0 ? (
                    <AdminListPagination
                        page={visibleRows.page}
                        totalPages={visibleRows.totalPages}
                        total={visibleRows.total}
                        limit={filters.limit}
                        itemLabel="varyant"
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                ) : null}
            </section>

            {hasTemplate ? (
                <section className="space-y-3">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="space-y-1">
                            <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Yeni satırlar ({drafts.length})
                            </h2>
                            {/* Operatör hiçbir kod yazmaz; hepsi kaydetme anında sunucuda üretilir. */}
                            <p className="text-xs text-neutral-500">
                                Kodlar kaydederken otomatik verilir: ölçü kodu ölçüden (küçükten büyüğe),
                                <span className="font-mono"> V1 </span> renk + hammadde kombinasyonundan,
                                tedarikçi harfi ise ilk kullanım sırasından.
                            </p>
                        </div>

                        <div className="flex items-end gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Tedarikçi sabitle</Label>
                                <Select value={pinnedSupplierId} onValueChange={setPinnedSupplierId}>
                                    <SelectTrigger className="w-56">
                                        <SelectValue placeholder="Yok" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" variant="outline" onClick={addRow}>
                                <Plus className="mr-2 size-4" />
                                Satır ekle
                            </Button>
                        </div>
                    </div>

                    {drafts.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-8" />
                                            {requirements.map((requirement) => (
                                                <TableHead key={requirement.id}>
                                                    {requirement.label}
                                                    {requirement.unit ? (
                                                        <span className="ml-1 text-xs font-normal text-neutral-500">
                                                            ({requirement.unit})
                                                        </span>
                                                    ) : null}
                                                    {requirement.isRequired ? (
                                                        <span className="ml-0.5 text-red-600">*</span>
                                                    ) : null}
                                                </TableHead>
                                            ))}
                                            <TableHead>Renk</TableHead>
                                            <TableHead>Hammadde</TableHead>
                                            <TableHead>Tedarikçi</TableHead>
                                            <TableHead>Tedarikçi kodu</TableHead>
                                            <TableHead>Alış fiyatı</TableHead>
                                            <TableHead className="text-right">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {drafts.map((row, index) => (
                                            <VariantMatrixDraftRow
                                                key={index}
                                                row={row}
                                                index={index}
                                                requirements={requirements}
                                                colors={colors}
                                                materials={materials}
                                                suppliers={suppliers}
                                                errors={errorsByIndex.get(index) ?? []}
                                                onChange={(patch) =>
                                                    setDrafts((current) =>
                                                        current.map((item, i) =>
                                                            i === index ? { ...item, ...patch } : item,
                                                        ),
                                                    )
                                                }
                                                onDuplicate={() =>
                                                    setDrafts((current) => [
                                                        ...current.slice(0, index + 1),
                                                        { ...current[index] },
                                                        ...current.slice(index + 1),
                                                    ])
                                                }
                                                onRemove={() =>
                                                    setDrafts((current) => current.filter((_, i) => i !== index))
                                                }
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button variant="ghost" onClick={() => setDrafts([])}>
                                    Taslakları temizle
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={validation.errors.length > 0 || saveMutation.isPending}
                                >
                                    {saveMutation.isPending ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 size-4" />
                                    )}
                                    {drafts.length} satırı kaydet
                                </Button>
                            </div>
                        </>
                    ) : (
                        <p className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
                            Katalogdan giriş yapmak için &quot;Satır ekle&quot;ye basın. Tedarikçi sabitlerseniz
                            yeni satırlar o tedarikçiyle açılır.
                        </p>
                    )}
                </section>
            ) : null}

            <MeasurementRequirementsDialog
                open={requirementsOpen}
                onOpenChange={setRequirementsOpen}
                productId={productId}
                productName={matrix.product.name}
            />
        </div>
    )
}
