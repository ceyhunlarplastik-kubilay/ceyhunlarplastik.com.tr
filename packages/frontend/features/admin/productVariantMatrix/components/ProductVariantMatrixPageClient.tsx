"use client"

import { useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Plus } from "lucide-react"

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
import { VariantMatrixContextRail } from "@/features/admin/productVariantMatrix/components/VariantMatrixContextRail"
import { VariantMatrixSaveBar } from "@/features/admin/productVariantMatrix/components/VariantMatrixSaveBar"
import { VariantMatrixDraftRow } from "@/features/admin/productVariantMatrix/components/VariantMatrixDraftRow"
import { VariantMatrixExistingTable } from "@/features/admin/productVariantMatrix/components/VariantMatrixExistingTable"
import { VariantMatrixFilters } from "@/features/admin/productVariantMatrix/components/VariantMatrixFilters"
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
import { previewVariantCodes } from "@/features/admin/productVariantMatrix/utils/previewVariantCodes"
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
    /** Versiyon sözlüğünden kayıt silme yalnız yöneticide açık. */
    canDeleteVersions?: boolean
}

export function ProductVariantMatrixPageClient({
    productId,
    productsBasePath,
    canManageCodes,
    canDeleteVersions = false,
}: Props) {
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
    const draftSectionRef = useRef<HTMLDivElement | null>(null)

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

    // Satırların ALACAĞI kodlar — core planlayıcısı mevcut sözlüklerin üzerine
    // taslaklar eklenmiş hâliyle çalıştırılır, kural burada tekrarlanmaz.
    const codePreviews = useMemo(() => {
        if (!matrix || validation.rows.length === 0) return []
        return previewVariantCodes({
            productCode: matrix.product.code,
            isLocked: Boolean(matrix.product.variantCodesLockedAt),
            requirements,
            sizes: matrix.sizes,
            versions: matrix.versions,
            supplierCodes: matrix.supplierCodes,
            rows: matrix.rows,
            draftRows: validation.rows,
            versionDictionary: matrix.versionDictionary,
        })
    }, [matrix, requirements, validation.rows])

    const duplicateToDraft = (row: MatrixRow, supplier?: MatrixRowSupplier) => {
        if (!matrix) return
        setDrafts((current) => [
            ...current,
            buildDraftFromRow({ row, sizes: matrix.sizes, versions: matrix.versions, supplier }),
        ])
    }

    /**
     * Sözlükte tanımlı OLMAYAN kombinasyonlar. Sunucu bu satırları reddediyor;
     * aynı kuralı burada da uygulayıp kullanıcıyı boşuna kaydetmeye bırakmıyoruz.
     * `previewVariantCodes` sırası `validation.rows` ile birebir, o da
     * `validRowIndexes` üzerinden taslak dizisine eşleniyor.
     */
    const undefinedVersionDraftIndexes = useMemo(() => {
        const result = new Set<number>()
        const validIndexes = drafts
            .map((_, index) => index)
            .filter((index) => !validation.errors.some((error) => error.index === index))

        codePreviews.forEach((preview, position) => {
            if (!preview.versionDefined) {
                const draftIndex = validIndexes[position]
                if (draftIndex !== undefined) result.add(draftIndex)
            }
        })
        return result
    }, [codePreviews, drafts, validation.errors])

    const errorsByIndex = useMemo(() => {
        const map = new Map<number, string[]>()
        for (const error of validation.errors) {
            map.set(error.index, [...(map.get(error.index) ?? []), error.message])
        }
        for (const index of undefinedVersionDraftIndexes) {
            map.set(index, [
                ...(map.get(index) ?? []),
                "Bu renk + hammadde kombinasyonu bu ürün modelinde tanımlı değil. Önce sol taraftaki versiyon sözlüğünden tanımlayın.",
            ])
        }
        return map
    }, [validation.errors, undefinedVersionDraftIndexes])

    /** Geçerli satırların taslak dizisindeki sırası — önizlemeyi eşlemek için. */
    const validRowIndexes = useMemo(
        () => drafts.map((_, index) => index).filter((index) => !errorsByIndex.has(index)),
        [drafts, errorsByIndex],
    )

    /**
     * Kaydetmenin ne ÜRETECEĞİ: kaç yeni ölçü kodu ve kaç yeni tedarikçi harfi.
     * Kaydet çubuğu bunu önceden söylüyor ki kod oluşumu sürpriz olmasın.
     */
    const saveEffects = useMemo(() => {
        if (!matrix) return { newSizeCount: 0, newSupplierCount: 0 }

        const existingCodes = new Set(matrix.rows.map((row) => row.fullCode))
        const newSizeCount = new Set(
            codePreviews
                .map((preview) => preview.fullCode)
                .filter((code): code is string => Boolean(code) && !existingCodes.has(code as string)),
        ).size

        const knownSuppliers = new Set(matrix.supplierCodes.map((entry) => entry.supplierId))
        const newSupplierCount = new Set(
            validation.rows
                .map((row) => row.supplier?.supplierId)
                .filter((id): id is string => Boolean(id) && !knownSuppliers.has(id as string)),
        ).size

        return { newSizeCount, newSupplierCount }
    }, [matrix, codePreviews, validation.rows])

    /** İlk hatalı satır ekran dışındaysa oraya kaydırır — bugün fark edilmiyordu. */
    const focusFirstError = () => {
        draftSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const addRow = () => {
        setDrafts((current) => [
            ...current,
            createEmptyDraftRow({ supplierId: pinnedSupplierId || undefined }),
        ])
    }

    const handleSave = async () => {
        if (errorsByIndex.size > 0 || validation.rows.length === 0) return
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

    const readyCount = validation.rows.length
    const errorCount = errorsByIndex.size

    return (
        <div className="flex min-h-dvh flex-col lg:flex-row">
            <VariantMatrixContextRail
                productId={productId}
                productsBasePath={productsBasePath}
                code={matrix.product.code}
                name={matrix.product.name}
                categoryName={(product as { category?: { name?: string } } | undefined)?.category?.name ?? null}
                assets={(product as { assets?: Array<{ role?: string; type?: string; url?: string }> } | undefined)?.assets ?? []}
                assetsLoading={productLoading}
                variantCount={matrix.rows.length}
                sizeCount={matrix.sizes.length}
                lockedAt={matrix.product.variantCodesLockedAt}
                canManageCodes={canManageCodes}
                canDeleteVersions={canDeleteVersions}
                isLockPending={lockMutation.isPending}
                isRenumberPending={renumberMutation.isPending}
                onToggleLock={(locked) => lockMutation.mutate(locked)}
                onRenumber={() => renumberMutation.mutate()}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex-1 space-y-6 p-5">
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
                            Bu ürün modeli için ölçü şablonu tanımlanmamış. Varyant girebilmek için soldaki
                            <span className="font-medium"> Ölçü şablonu </span>
                            bölümünden en az bir ölçü ekleyin.
                        </div>
                    ) : null}

                    {/* GİRİŞ ÖNCE: operatörün asıl işi bu; kayıtlı liste altta kalır. */}
                    {hasTemplate ? (
                        <section ref={draftSectionRef} className="space-y-3">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div className="space-y-1">
                                    <h2 className="text-[15px] font-semibold">Giriş</h2>
                                    <p className="text-xs text-neutral-500">
                                        Kodlar kaydederken otomatik verilir: ölçü kodu ölçüden (küçükten büyüğe),
                                        <span className="font-mono"> V1 </span> renk + hammadde kombinasyonundan,
                                        tedarikçi harfi ilk kullanım sırasından.
                                    </p>
                                </div>

                                <div className="flex items-end gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tedarikçi sabitle</Label>
                                        <Select value={pinnedSupplierId} onValueChange={setPinnedSupplierId}>
                                            <SelectTrigger className="w-52">
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
                                                <TableHead>Kod</TableHead>
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
                                                    codePreview={codePreviews[validRowIndexes.indexOf(index)]}
                                                    onChange={(patch) =>
                                                        setDrafts((current) =>
                                                            current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
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
                            ) : (
                                <p className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
                                    Katalogdan giriş yapmak için &quot;Satır ekle&quot;ye basın. Tedarikçi sabitlerseniz
                                    yeni satırlar o tedarikçiyle açılır.
                                </p>
                            )}
                        </section>
                    ) : null}

                    <section className="space-y-3">
                        <h2 className="text-[15px] font-semibold">
                            Kayıtlı varyantlar{" "}
                            <span className="text-sm font-normal text-neutral-500">{matrix.rows.length} kayıt</span>
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
                </div>

                {hasTemplate ? (
                    <VariantMatrixSaveBar
                        draftCount={drafts.length}
                        readyCount={readyCount}
                        errorCount={errorCount}
                        isSaving={saveMutation.isPending}
                        isLocked={Boolean(matrix.product.variantCodesLockedAt)}
                        newSizeCount={saveEffects.newSizeCount}
                        newSupplierCount={saveEffects.newSupplierCount}
                        onAddRow={addRow}
                        onClear={() => setDrafts([])}
                        onSave={handleSave}
                        onFocusFirstError={focusFirstError}
                    />
                ) : null}
            </div>
        </div>
    )
}
