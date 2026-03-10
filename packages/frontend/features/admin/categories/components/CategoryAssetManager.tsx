"use client";

import { useMemo, useState } from "react";

import type { Category } from "@/features/public/categories/types";
import type { Asset, AssetRole } from "@/features/public/assets/types";

import { AssetRoleTabs } from "@/features/admin/categories/components/asset/AssetRoleTabs";
import { AssetGrid } from "@/features/admin/categories/components/asset/AssetGrid";
import { AssetPreviewPanel } from "@/features/admin/categories/components/asset/AssetPreviewPanel";
import { AssetUploader } from "@/features/admin/categories/components/asset/AssetUploader";

type Props = {
    category: Category;
    authHeader: Record<string, string> | null;
    onCategoryChanged: (category: Category) => void;
    refetchCategory: () => Promise<void>;
};

export function CategoryAssetManager({
    category,
    authHeader,
    onCategoryChanged,
    refetchCategory,
}: Props) {

    const [activeRole, setActiveRole] = useState<AssetRole>("PRIMARY");
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const assetsByRole = useMemo(() => {

        const map = new Map<AssetRole, Asset[]>();

        for (const asset of category.assets ?? []) {

            const role = asset.role as AssetRole;

            if (!map.has(role)) {
                map.set(role, []);
            }

            map.get(role)!.push(asset);
        }

        return map;

    }, [category.assets]);

    const visibleAssets = assetsByRole.get(activeRole) ?? [];

    return (
        <div className="space-y-6">

            <AssetRoleTabs
                assetsByRole={assetsByRole}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
            />

            <div className="grid grid-cols-12 gap-6">

                <AssetGrid
                    assets={visibleAssets}
                    selectedAsset={selectedAsset}
                    setSelectedAsset={setSelectedAsset}
                    activeRole={activeRole}
                />

                <AssetPreviewPanel
                    asset={selectedAsset}
                    refetchCategory={refetchCategory}
                />

            </div>

            <AssetUploader
                category={category}
                activeRole={activeRole}
                refetchCategory={refetchCategory}
            />

        </div>
    );
}