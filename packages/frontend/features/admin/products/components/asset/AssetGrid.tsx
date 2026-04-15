"use client"

import { Trash2, FileText, Film, Image as ImageIcon } from "lucide-react"

import { useDeleteAsset } from "@/features/admin/categories/hooks/useDeleteAsset"

import type { Asset } from "@/features/public/assets/types"

type Props = {
    assets: Asset[]
    selectedAssetId: string | null
    onSelect: (id: string) => void
    refetchProduct: () => Promise<void>
}

export function AssetGrid({
    assets,
    selectedAssetId,
    onSelect,
    refetchProduct
}: Props) {

    const deleteMutation = useDeleteAsset()

    async function handleDelete(assetId: string) {
        const ok = confirm("Asset silinsin mi?")
        if (!ok) return
        await deleteMutation.mutateAsync({
            assetId
        })
        await refetchProduct()
    }

    if (!assets.length) {
        return (
            <div className="col-span-4 text-sm text-neutral-400 text-center py-10">
                Bu role ait asset bulunamadı
            </div>
        )
    }

    return (
        <div className="grid grid-cols-4 gap-4">
            {assets.map(asset => {
                const isSelected = selectedAssetId === asset.id
                return (
                    <div
                        key={asset.id}
                        className={`relative border rounded-lg overflow-hidden cursor-pointer group 
                        ${isSelected ? "ring-2 ring-black" : ""}`}
                        onClick={() => onSelect(asset.id)}
                    >
                        {/* PREVIEW */}
                        {asset.type === "IMAGE" && (
                            <img
                                src={asset.url}
                                className="w-full h-28 object-cover"
                                alt=""
                            />
                        )}
                        {asset.type === "VIDEO" && (

                            <div className="flex items-center justify-center h-28 bg-neutral-100">
                                <Film size={20} />
                            </div>

                        )}
                        {asset.type === "PDF" && (
                            <div className="flex items-center justify-center h-28 bg-neutral-100">
                                <FileText size={20} />
                            </div>
                        )}
                        {!["IMAGE", "VIDEO", "PDF"].includes(asset.type) && (

                            <div className="flex items-center justify-center h-28 bg-neutral-100">
                                <ImageIcon size={20} />
                            </div>
                        )}
                        {/* DELETE */}
                        <button
                            type="button"
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(asset.id)
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
