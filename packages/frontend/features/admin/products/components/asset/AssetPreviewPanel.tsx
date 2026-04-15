"use client"

import { Copy, ExternalLink, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useDeleteAsset } from "@/features/admin/categories/hooks/useDeleteAsset"
import type { Asset } from "@/features/public/assets/types"

type Props = {
    asset: Asset | null
}

export function AssetPreviewPanel({
    asset
}: Props) {

    const deleteMutation = useDeleteAsset()

    if (!asset) {
        return (
            <div className="border rounded-xl p-4 bg-white">
                <div className="text-sm text-muted-foreground text-center">
                    Asset seç
                </div>
            </div>
        )
    }

    // Capture narrowed asset for closures
    const currentAsset = asset

    async function copy() {
        await navigator.clipboard.writeText(currentAsset.url)
        toast.success("URL kopyalandı")
    }

    async function handleDelete() {
        const ok = confirm("Asset silinsin mi?")
        if (!ok) return

        await deleteMutation.mutateAsync({
            assetId: currentAsset.id
        })
    }

    return (
        <div className="border rounded-xl p-4 bg-white space-y-4">
            <div className="text-sm font-medium">
                Detay / Önizleme
            </div>

            {currentAsset.type === "IMAGE" && (
                <img
                    src={currentAsset.url}
                    className="max-h-[260px] w-full object-contain"
                    alt=""
                />
            )}

            {currentAsset.type === "VIDEO" && (
                <video
                    src={currentAsset.url}
                    controls
                    className="max-h-[260px] w-full"
                />
            )}
            {currentAsset.type === "PDF" && (
                <iframe
                    src={currentAsset.url}
                    className="w-full h-[260px]"
                />
            )}
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(currentAsset.url)}
                >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Aç
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copy}
                >
                    <Copy className="h-4 w-4 mr-1" />
                    URL Kopyala
                </Button>
                <Button
                    type="button"
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
    )
}
