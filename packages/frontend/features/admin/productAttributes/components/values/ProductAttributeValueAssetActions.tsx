"use client"

import { Loader2, Trash2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Props = {
    value: ProductAttributeValue
    asset?: NonNullable<ProductAttributeValue["assets"]>[number]
    isUploading: boolean
    isDeletingAsset: boolean
    onUpload: (valueId: string, file?: File | null) => void
    onRequestDeleteAsset: (
        target: {
            value: ProductAttributeValue
            asset: NonNullable<ProductAttributeValue["assets"]>[number]
        }
    ) => void
}

export function ProductAttributeValueAssetActions({
    value,
    asset,
    isUploading,
    isDeletingAsset,
    onUpload,
    onRequestDeleteAsset,
}: Props) {
    const fileInputId = `attribute-value-image-${value.id}`

    return (
        <>
            <label htmlFor={fileInputId}>
                <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading || isDeletingAsset}
                    onChange={(event) => {
                        onUpload(value.id, event.target.files?.[0])
                        event.currentTarget.value = ""
                    }}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 aria-disabled:pointer-events-none aria-disabled:opacity-50">
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UploadCloud className="h-4 w-4" />
                    )}
                    {asset ? "Görseli Değiştir" : "Görsel Yükle"}
                </span>
            </label>

            {asset ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-2 text-xs text-red-600 hover:text-red-700"
                    onClick={() => onRequestDeleteAsset({ value, asset })}
                    disabled={isUploading || isDeletingAsset}
                >
                    {isDeletingAsset ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    Görseli Sil
                </Button>
            ) : null}
        </>
    )
}
