"use client";

import { toast } from "sonner";
import { Copy, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDeleteAsset } from "@/features/admin/categories/hooks/useDeleteAsset";

import type { Asset } from "@/features/public/assets/types";

type Props = {
    asset: Asset | null;
    refetchCategory: () => Promise<void>;
};

export function AssetPreviewPanel({
    asset,
    refetchCategory,
}: Props) {

    const deleteMutation = useDeleteAsset()

    if (!asset) {
        return (
            <div className="col-span-5 border rounded-xl p-4 bg-white">
                <div className="text-sm text-muted-foreground text-center">
                    Asset seç
                </div>
            </div>
        );
    }

    const copy = async () => {
        await navigator.clipboard.writeText(asset.url);
        toast.success("URL kopyalandı");
    };

    const handleDelete = () => {

        deleteMutation.mutate({
            assetId: asset.id,
            refetchCategory,
        })

    };

    return (
        <div className="col-span-5 border rounded-xl p-4 bg-white space-y-4">

            <div className="text-sm font-medium">
                Detay / Önizleme
            </div>

            {asset.type === "IMAGE" && (
                <img
                    src={asset.url}
                    className="max-h-[260px] w-full object-contain"
                />
            )}

            {asset.type === "VIDEO" && (
                <video
                    src={asset.url}
                    controls
                    className="max-h-[260px] w-full"
                />
            )}

            <div className="flex flex-wrap gap-2">

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(asset.url)}
                >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Aç
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={copy}
                >
                    <Copy className="h-4 w-4 mr-1" />
                    URL Kopyala
                </Button>

                <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                </Button>

            </div>

        </div>
    );
}