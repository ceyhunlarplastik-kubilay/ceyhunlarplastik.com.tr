"use client"

import { ProductAttributeValueCard } from "@/features/admin/productAttributes/components/values/ProductAttributeValueCard"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Asset = NonNullable<ProductAttributeValue["assets"]>[number]

type Props = {
    values: ProductAttributeValue[]
    attributeCode: string
    parentAttributeCode: string | null
    parentLabel: string
    parentValues: ProductAttributeValue[]
    linkedProductionGroups: ProductAttributeValue[]
    selectedSectorValueId: string | null
    uploadingValueId: string | null
    updatingValueId: string | null
    deletingValueId: string | null
    deletingAssetId: string | null
    isUploadPending: boolean
    isUpdatePending: boolean
    isDeleteValuePending: boolean
    isDeleteAssetPending: boolean
    onToggleLinkedGroups: (valueId: string) => void
    onUploadAsset: (valueId: string, file?: File | null) => void
    onUpdateValue: (input: {
        id: string
        name: string
        englishName?: string
        parentValueId?: string
    }) => Promise<void>
    onRequestDeleteValue: (value: ProductAttributeValue) => void
    onRequestDeleteAsset: (target: { value: ProductAttributeValue; asset: Asset }) => void
}

export function ProductAttributeValuesGrid({
    values,
    attributeCode,
    parentAttributeCode,
    parentLabel,
    parentValues,
    linkedProductionGroups,
    selectedSectorValueId,
    uploadingValueId,
    updatingValueId,
    deletingValueId,
    deletingAssetId,
    isUploadPending,
    isUpdatePending,
    isDeleteValuePending,
    isDeleteAssetPending,
    onToggleLinkedGroups,
    onUploadAsset,
    onUpdateValue,
    onRequestDeleteValue,
    onRequestDeleteAsset,
}: Props) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {values.map((value, index) => {
                const asset = value.assets?.find((item) => item.role === "PRIMARY") ?? value.assets?.[0]

                return (
                    <ProductAttributeValueCard
                        key={value.id}
                        value={value}
                        index={index}
                        attributeCode={attributeCode}
                        parentAttributeCode={parentAttributeCode}
                        parentLabel={parentLabel}
                        parentValues={parentValues}
                        linkedProductionGroups={linkedProductionGroups}
                        isLinkedGroupsOpen={selectedSectorValueId === value.id}
                        isUploading={isUploadPending && uploadingValueId === value.id}
                        isUpdating={isUpdatePending && updatingValueId === value.id}
                        isDeletingValue={isDeleteValuePending && deletingValueId === value.id}
                        isDeletingAsset={Boolean(asset?.id && isDeleteAssetPending && deletingAssetId === asset.id)}
                        onToggleLinkedGroups={onToggleLinkedGroups}
                        onUploadAsset={onUploadAsset}
                        onUpdateValue={onUpdateValue}
                        onRequestDeleteValue={onRequestDeleteValue}
                        onRequestDeleteAsset={onRequestDeleteAsset}
                    />
                )
            })}
        </div>
    )
}
