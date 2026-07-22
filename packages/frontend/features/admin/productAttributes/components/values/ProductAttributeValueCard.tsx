"use client"

import Image from "next/image"
import { useState } from "react"
import { motion } from "motion/react"
import { Layers3, Loader2, Pencil, Trash2, ImagePlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ATTRIBUTE_CODES } from "@/features/admin/productAttributes/constants"
import { LinkedProductionGroupsPanel } from "@/features/admin/productAttributes/components/values/LinkedProductionGroupsPanel"
import { ProductAttributeValueAssetActions } from "@/features/admin/productAttributes/components/values/ProductAttributeValueAssetActions"
import { ProductAttributeValueEditForm } from "@/features/admin/productAttributes/components/values/ProductAttributeValueEditForm"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Asset = NonNullable<ProductAttributeValue["assets"]>[number]

type Props = {
    value: ProductAttributeValue
    index: number
    attributeCode: string
    parentAttributeCode: string | null
    parentLabel: string
    parentValues: ProductAttributeValue[]
    linkedProductionGroups: ProductAttributeValue[]
    isLinkedGroupsOpen: boolean
    isUploading: boolean
    isUpdating: boolean
    isDeletingValue: boolean
    isDeletingAsset: boolean
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

export function ProductAttributeValueCard({
    value,
    index,
    attributeCode,
    parentAttributeCode,
    parentLabel,
    parentValues,
    linkedProductionGroups,
    isLinkedGroupsOpen,
    isUploading,
    isUpdating,
    isDeletingValue,
    isDeletingAsset,
    onToggleLinkedGroups,
    onUploadAsset,
    onUpdateValue,
    onRequestDeleteValue,
    onRequestDeleteAsset,
}: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const asset = value.assets?.find((item) => item.role === "PRIMARY") ?? value.assets?.[0]
    const isBusy = isUploading || isUpdating || isDeletingValue || isDeletingAsset

    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.025 }}
            className={[
                "overflow-hidden rounded-[24px] border bg-white shadow-sm transition",
                isLinkedGroupsOpen
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-neutral-200",
            ].join(" ")}
        >
            <div className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
                <div className="relative aspect-[16/10] min-h-[170px] border-b border-neutral-200 bg-neutral-100 sm:aspect-auto sm:min-h-[190px] sm:border-b-0 sm:border-r">
                    {asset?.url ? (
                        <Image
                            src={asset.url}
                            alt={`${value.name} görseli`}
                            fill
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, 180px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full min-h-[170px] flex-col items-center justify-center gap-2 text-neutral-400">
                            <ImagePlus className="h-7 w-7" />
                            <span className="text-xs">Görsel yok</span>
                        </div>
                    )}
                    {isBusy ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                            <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
                        </div>
                    ) : null}
                </div>

                <div className="flex min-w-0 flex-col gap-4 p-4">
                    {isEditing ? (
                        <ProductAttributeValueEditForm
                            value={value}
                            parentAttributeCode={parentAttributeCode}
                            parentLabel={parentLabel}
                            parentValues={parentValues}
                            isPending={isUpdating}
                            onCancel={() => setIsEditing(false)}
                            onSave={onUpdateValue}
                        />
                    ) : (
                        <>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3
                                        className="max-w-full truncate text-base font-semibold text-neutral-950"
                                        title={value.name}
                                    >
                                        {value.name}
                                    </h3>
                                    {asset ? <Badge variant="outline">Görsel var</Badge> : null}
                                </div>
                                {value.parentValue?.name ? (
                                    <p className="mt-1 text-sm text-neutral-500">
                                        Bağlı {parentLabel}: {value.parentValue.name}
                                    </p>
                                ) : null}
                            </div>

                            <div className="mt-auto flex flex-wrap items-center gap-2">
                                <ProductAttributeValueAssetActions
                                    value={value}
                                    asset={asset}
                                    isUploading={isUploading}
                                    isDeletingAsset={isDeletingAsset}
                                    onUpload={onUploadAsset}
                                    onRequestDeleteAsset={onRequestDeleteAsset}
                                />

                                {attributeCode === ATTRIBUTE_CODES.sector ? (
                                    <Button
                                        size="sm"
                                        variant={isLinkedGroupsOpen ? "default" : "outline"}
                                        className="h-9 gap-2"
                                        onClick={() => onToggleLinkedGroups(value.id)}
                                        disabled={isBusy}
                                    >
                                        <Layers3 className="h-4 w-4" />
                                        Bağlı Gruplar
                                    </Button>
                                ) : null}

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setIsEditing(true)}
                                    disabled={isBusy}
                                    aria-label={`${value.name} değerini düzenle`}
                                >
                                    <Pencil className="h-4 w-4 text-neutral-600" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onRequestDeleteValue(value)}
                                    disabled={isBusy}
                                    aria-label={`${value.name} değerini sil`}
                                >
                                    {isDeletingValue ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isLinkedGroupsOpen ? (
                <LinkedProductionGroupsPanel groups={linkedProductionGroups} />
            ) : null}
        </motion.article>
    )
}
