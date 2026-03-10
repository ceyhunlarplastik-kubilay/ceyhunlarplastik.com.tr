"use client";

import { useState } from "react";
import { Trash2, Image as ImageIcon, Film, FileText, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApiClient } from "@/lib/http/client";
import { motion, AnimatePresence } from "framer-motion";

type Asset = {
    id: string;
    url: string;
    role: string;
    type?: string;
};

type Props = {
    productId: string;
    assets: Asset[];
    onChanged?: () => void;
};

export function ProductImageGallery({ productId, assets, onChanged }: Props) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function deleteAsset(assetId: string) {
        const ok = confirm("Bu dökümanı kalıcı olarak silmek istediğinize emin misiniz?");
        if (!ok) return;

        setDeletingId(assetId);
        try {
            await adminApiClient.delete(`/assets/${assetId}`);
            onChanged?.();
        } catch (err) {
            console.error(err);
            alert("Asset silinemedi");
        } finally {
            setDeletingId(null);
        }
    }

    function renderPreview(asset: Asset) {
        const isImage = asset.url.match(/\.(jpeg|jpg|gif|png|webp)/i) || asset.type === "IMAGE";
        const isVideo = asset.url.match(/\.(mp4|webm|ogg)/i) || asset.type === "VIDEO";

        if (isImage) {
            return (
                <img
                    src={asset.url}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={`Asset ${asset.role}`}
                />
            );
        }

        if (isVideo) {
            return (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                    <Film className="w-8 h-8 text-neutral-400" />
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-neutral-400" />
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
                <ImageIcon className="w-8 h-8 text-neutral-300 mb-3" />
                <p className="text-sm font-medium text-neutral-600">Henüz galeriye eklenen bir öge yok</p>
                <p className="text-xs text-neutral-400 mt-1">Yukarıdaki panelden ürününüz için görsel veya döküman yükleyebilirsiniz.</p>
            </div>
        );
    }

    return (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
                {assets.map((asset, i) => {
                    const isDeleting = deletingId === asset.id;

                    return (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.25, delay: i * 0.05 }}
                            key={asset.id}
                            className="relative group border border-neutral-200/80 rounded-xl overflow-hidden bg-white shadow-sm"
                        >
                            <div className="h-32 w-full overflow-hidden bg-neutral-50">
                                {renderPreview(asset)}
                            </div>

                            {/* Info overlay */}
                            <div className="absolute top-0 inset-x-0 p-2 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] uppercase font-semibold px-2 py-0.5 rounded">
                                    {asset.role}
                                </span>
                            </div>

                            {/* Action overlay */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">

                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 rounded-full bg-white text-black hover:bg-neutral-100 shadow-lg"
                                        onClick={() => window.open(asset.url, "_blank")}
                                        title="Görüntüle"
                                    >
                                        <Info size={14} />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8 rounded-full shadow-lg"
                                        onClick={() => deleteAsset(asset.id)}
                                        disabled={isDeleting}
                                        title="Sil"
                                    >
                                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 size={14} />}
                                    </Button>
                                </div>
                            </div>

                            {isDeleting && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                    <Loader2 className="w-5 h-5 text-neutral-900 animate-spin" />
                                </div>
                            )}

                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
}