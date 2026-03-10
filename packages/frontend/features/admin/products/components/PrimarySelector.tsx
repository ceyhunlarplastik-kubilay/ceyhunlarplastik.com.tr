"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { adminApiClient } from "@/lib/http/client";
import { motion, AnimatePresence } from "framer-motion";

type Asset = {
    id: string;
    url: string;
    role: string;
};

type Props = {
    productId: string;
    assets: Asset[];
    onChanged?: () => void;
};

export function PrimarySelector({ productId, assets, onChanged }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    async function setPrimary(asset: Asset) {
        setLoadingId(asset.id);
        try {
            await adminApiClient.put(`/products/${productId}`, {
                assetType: "IMAGE",
                assetRole: "PRIMARY",
                assetKey: asset.url.split("/").slice(-3).join("/"),
                mimeType: "image/jpeg" // Assuming images for Primary
            });
            onChanged?.();
        } catch (err) {
            console.error(err);
            alert("Ana görsel değiştirilemedi");
        } finally {
            setLoadingId(null);
        }
    }

    // Yalnızca seçebileceğimiz (gallery & primary vb) assetlere odaklanıyoruz
    const images = assets.filter(a => a.url.match(/\.(jpeg|jpg|png|webp|gif)/i));

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
                <Info className="w-6 h-6 text-neutral-400 mb-2" />
                <p className="text-xs text-neutral-500 text-center">Ana görsel olarak seçebilecek yüklü bir resim bulunamadı.</p>
            </div>
        );
    }

    return (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
                {images.map(asset => {
                    const isPrimary = asset.role === "PRIMARY";
                    const isLoading = loadingId === asset.id;

                    return (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={asset.id}
                            className={`
                                relative group rounded-xl overflow-hidden bg-muted
                                shadow-sm transition-all duration-300
                                ${isPrimary ? 'ring-2 ring-black ring-offset-2' : 'border border-neutral-200/60 hover:border-black/50'}
                            `}
                        >
                            <img
                                src={asset.url}
                                className="w-full h-32 object-cover bg-white transition-transform duration-500 group-hover:scale-105"
                                alt="Product asset"
                            />

                            <div className={`
                                absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300
                                ${isPrimary ? 'bg-black/10' : 'bg-black/40 opacity-0 group-hover:opacity-100'}
                            `}>
                                <Button
                                    size="sm"
                                    onClick={() => setPrimary(asset)}
                                    disabled={isLoading || isPrimary}
                                    className={`
                                        shadow-lg backdrop-blur-sm transition-all
                                        ${isPrimary ? 'bg-black text-white hover:bg-black/90' : 'bg-white/90 text-black hover:bg-white'}
                                    `}
                                >
                                    {isLoading ? "İşleniyor..." : isPrimary ? (
                                        <span className="flex items-center gap-1.5"><Check size={14} className="stroke-[3]" /> Ana Görsel</span>
                                    ) : "Ana Görsel Yap"}
                                </Button>
                            </div>

                            {isPrimary && (
                                <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    PRIMARY
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
}