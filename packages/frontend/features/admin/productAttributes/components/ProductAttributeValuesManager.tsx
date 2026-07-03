"use client"

import { RefreshCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { DeleteAssetDialog } from "@/features/admin/productAttributes/components/values/DeleteAssetDialog"
import { DeleteProductAttributeValueDialog } from "@/features/admin/productAttributes/components/values/DeleteProductAttributeValueDialog"
import { ProductAttributeValueCreatePanel } from "@/features/admin/productAttributes/components/values/ProductAttributeValueCreatePanel"
import { ProductAttributeValuesEmptyState } from "@/features/admin/productAttributes/components/values/ProductAttributeValuesEmptyState"
import { ProductAttributeValuesGrid } from "@/features/admin/productAttributes/components/values/ProductAttributeValuesGrid"
import { ProductAttributeValuesSkeleton } from "@/features/admin/productAttributes/components/values/ProductAttributeValuesSkeleton"
import { ProductAttributeValuesToolbar } from "@/features/admin/productAttributes/components/values/ProductAttributeValuesToolbar"
import { VALUE_PAGE_SIZE_OPTIONS } from "@/features/admin/productAttributes/constants"
import { useProductAttributeValuesManager } from "@/features/admin/productAttributes/hooks/useProductAttributeValuesManager"

type Props = {
    attributeId: string
    attributeCode: string
}

export function ProductAttributeValuesManager({ attributeId, attributeCode }: Props) {
    const manager = useProductAttributeValuesManager({ attributeId, attributeCode })

    return (
        <div className="space-y-5">
            <ProductAttributeValueCreatePanel
                attributeId={attributeId}
                currentLabel={manager.currentLabel}
                parentAttributeCode={manager.parentAttributeCode}
                parentLabel={manager.parentLabel}
                parentValues={manager.parentValues}
                isPending={manager.createMutation.isPending}
                onCreate={manager.createValue}
            />

            <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-neutral-50">
                        {manager.filteredValues.length} değer
                    </Badge>
                    <Badge variant="outline" className="bg-neutral-50">
                        {manager.visualCount} görsel
                    </Badge>
                    {manager.isFetching && !manager.isInitialLoading ? (
                        <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <RefreshCcw className="h-3 w-3 animate-spin" />
                            Yenileniyor
                        </Badge>
                    ) : null}
                </div>
                <p className="text-xs leading-5 text-neutral-500">
                    Arama ve filtreler mevcut kartları koruyarak güncellenir; işlemler sadece ilgili kartı kilitler.
                </p>
            </div>

            <ProductAttributeValuesToolbar
                search={manager.search}
                parentFilterValueId={manager.parentFilterValueId}
                parentAttributeCode={manager.parentAttributeCode}
                parentLabel={manager.parentLabel}
                parentValues={manager.parentValues}
                onSearchChange={manager.setSearch}
                onParentFilterChange={manager.setParentFilterValueId}
                onClearFilters={manager.clearFilters}
            />

            <div className="relative">
                {manager.isFetching && !manager.isInitialLoading ? (
                    <div className="pointer-events-none absolute inset-0 z-10 rounded-[28px] border border-emerald-100 bg-white/35 backdrop-blur-[1px]" />
                ) : null}

                {manager.isInitialLoading ? (
                    <ProductAttributeValuesSkeleton />
                ) : manager.filteredValues.length === 0 ? (
                    <ProductAttributeValuesEmptyState
                        hasValues={manager.values.length > 0}
                        hasActiveFilters={manager.hasActiveFilters}
                        currentLabel={manager.currentLabel}
                        onClearFilters={manager.clearFilters}
                    />
                ) : (
                    <ProductAttributeValuesGrid
                        values={manager.paginatedValues}
                        attributeCode={attributeCode}
                        parentAttributeCode={manager.parentAttributeCode}
                        parentLabel={manager.parentLabel}
                        parentValues={manager.parentValues}
                        linkedProductionGroups={manager.linkedProductionGroups}
                        selectedSectorValueId={manager.selectedSectorValueId}
                        uploadingValueId={manager.uploadingValueId}
                        updatingValueId={manager.updatingValueId}
                        deletingValueId={manager.deletingValueId}
                        deletingAssetId={manager.deletingAssetId}
                        isUploadPending={manager.uploadAssetMutation.isPending}
                        isUpdatePending={manager.updateMutation.isPending}
                        isDeleteValuePending={manager.deleteValueMutation.isPending}
                        isDeleteAssetPending={manager.deleteAssetMutation.isPending}
                        onToggleLinkedGroups={manager.toggleLinkedGroups}
                        onUploadAsset={manager.uploadAsset}
                        onUpdateValue={manager.updateValue}
                        onRequestDeleteValue={manager.requestDeleteValue}
                        onRequestDeleteAsset={manager.requestDeleteAsset}
                    />
                )}
            </div>

            <AdminListPagination
                page={manager.currentPage}
                totalPages={manager.totalPages}
                total={manager.filteredValues.length}
                limit={manager.limit}
                itemLabel="değer"
                limitOptions={VALUE_PAGE_SIZE_OPTIONS}
                onPageChange={manager.setPage}
                onLimitChange={manager.setLimit}
            />

            <DeleteProductAttributeValueDialog
                value={manager.valueDeleteTarget}
                open={Boolean(manager.valueDeleteTarget)}
                isPending={manager.deleteValueMutation.isPending}
                onOpenChange={(open) => {
                    if (!open) manager.cancelDeleteValue()
                }}
                onConfirm={manager.confirmDeleteValue}
            />

            <DeleteAssetDialog
                target={manager.assetDeleteTarget}
                open={Boolean(manager.assetDeleteTarget)}
                isPending={manager.deleteAssetMutation.isPending}
                onOpenChange={(open) => {
                    if (!open) manager.cancelDeleteAsset()
                }}
                onConfirm={manager.confirmDeleteAsset}
            />
        </div>
    )
}
