"use client"

import { useMemo, useState } from "react"

import type { Product } from "@/features/public/products/types"
import type { AssetRole, Asset } from "@/features/public/assets/types"

import { AssetRoleTabs } from "@/features/admin/products/components/asset/AssetRoleTabs"
import { AssetUploader } from "@/features/admin/products/components/asset/AssetUploader"
import { AssetGrid } from "@/features/admin/products/components/asset/AssetGrid"
import { AssetPreviewPanel } from "@/features/admin/products/components/asset/AssetPreviewPanel"

type Props = {
    product: Product
    refetchProduct: () => Promise<void>
}

export function ProductAssetManager({
    product,
    refetchProduct
}: Props) {

    const [activeRole, setActiveRole] = useState<AssetRole>("PRIMARY")
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

    const assets: Asset[] = (product as any).assets ?? []

    const assetsByRole = useMemo(() => {
        const map = new Map<AssetRole, Asset[]>()

        for (const asset of assets) {
            const role = asset.role as AssetRole
            if (!map.has(role)) map.set(role, [])
            map.get(role)!.push(asset)
        }
        return map
    }, [assets])

    const filteredAssets = assetsByRole.get(activeRole) ?? []
    const selectedAsset = assets.find(a => a.id === selectedAssetId) ?? null

    return (
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-4">
                <AssetRoleTabs
                    assetsByRole={assetsByRole}
                    activeRole={activeRole}
                    setActiveRole={setActiveRole}
                />
                <AssetUploader
                    product={product}
                    activeRole={activeRole}
                    refetchProduct={refetchProduct}
                />
                <AssetGrid
                    assets={filteredAssets}
                    selectedAssetId={selectedAssetId}
                    onSelect={setSelectedAssetId}
                    refetchProduct={refetchProduct}
                />
            </div>
            <div className="col-span-4">
                <AssetPreviewPanel
                    asset={selectedAsset}
                />
            </div>
        </div>
    )
}
