"use client";

import { Image as ImageIcon, Film, FileText, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Asset, AssetRole } from "@/features/public/assets/types";

type Props = {
    assets: Asset[];
    selectedAsset: Asset | null;
    setSelectedAsset: (asset: Asset) => void;
    activeRole: AssetRole;
};

export function AssetGrid({
    assets,
    selectedAsset,
    setSelectedAsset,
    activeRole,
}: Props) {

    return (
        <div className="col-span-7 border rounded-xl p-4 bg-white">

            <div className="text-sm font-medium pb-3">
                {activeRole} Assets
            </div>

            {assets.length === 0 && (
                <div className="border border-dashed rounded-lg p-6 text-sm text-muted-foreground text-center">
                    Bu role için asset yok
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">

                {assets.map((asset) => {

                    const selected = selectedAsset?.id === asset.id;
                    const pending = asset.uploadStatus === "PENDING_UPLOAD";

                    return (
                        <button
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`relative rounded-lg border overflow-hidden transition
                ${selected ? "ring-2 ring-black" : ""}
              `}
                        >

                            {pending && (
                                <Badge
                                    variant="secondary"
                                    className="absolute left-1 top-1 z-10 gap-1 px-1.5 py-0 text-[10px]"
                                >
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    İşleniyor
                                </Badge>
                            )}

                            <div
                                className={`h-24 w-full bg-muted flex items-center justify-center ${pending ? "opacity-50" : ""}`}
                            >

                                {asset.type === "IMAGE" && (
                                    <img
                                        src={asset.url}
                                        className="h-full w-full object-cover"
                                    />
                                )}

                                {asset.type === "VIDEO" && (
                                    <Film className="h-5 w-5 text-muted-foreground" />
                                )}

                                {asset.type === "PDF" && (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                )}

                                {!["IMAGE", "VIDEO", "PDF"].includes(asset.type) && (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                )}

                            </div>

                        </button>
                    );
                })}

            </div>

        </div>
    );
}