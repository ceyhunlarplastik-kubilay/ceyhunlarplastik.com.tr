"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { adminApiClient } from "@/lib/http/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Product } from "@/features/public/products/types";
import type { AssetRole, AssetType } from "@/features/public/assets/types";

type Props = {
    product: Product;
    onUploadSuccess?: () => void;
};

const ROLE_OPTIONS: AssetRole[] = [
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
];

const TYPE_OPTIONS: AssetType[] = [
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
];

export function ProductAssetsUploader({ product, onUploadSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY");
    const [assetType, setAssetType] = useState<AssetType>("IMAGE");
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const uploadMutation = useMutation({
        mutationFn: async (selectedFile: File) => {
            const presignRes = await adminApiClient.post("/products/assets/presign", {
                productSlug: product.slug,
                fileName: selectedFile.name,
                contentType: selectedFile.type,
                assetRole,
            });

            const { uploadUrl, key } = presignRes.data.payload;

            await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": selectedFile.type },
                body: selectedFile,
            });

            await adminApiClient.put(`/products/${product.id}`, {
                assetType,
                assetRole,
                assetKey: key,
                mimeType: selectedFile.type,
            });

            return key;
        },
        onSuccess: () => {
            setStatus("success");
            setFile(null);
            if (onUploadSuccess) onUploadSuccess();

            setTimeout(() => setStatus("idle"), 3000); // 3 saniye sonra idle dön
        },
        onError: (err) => {
            console.error("Yükleme hatası:", err);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 5000);
        }
    });

    const handleUploadClick = () => {
        if (!file) {
            alert("Lütfen önce bir dosya seçin.");
            return;
        }
        setStatus("idle");
        uploadMutation.mutate(file);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-neutral-200/60 rounded-2xl p-6 bg-white shadow-sm space-y-5"
        >
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-xl">
                    <UploadCloud className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-neutral-900">Asset Yükleme</h3>
                    <p className="text-xs text-neutral-500">Ürüne resim, video veya PDF dökümanları ekleyin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-neutral-50/50 p-4 rounded-xl border border-neutral-100">
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-medium text-neutral-600 ml-1">Asset Tipi</label>
                    <Select value={assetType} onValueChange={(val) => setAssetType(val as AssetType)}>
                        <SelectTrigger className="bg-white border-neutral-200/70 shadow-sm focus:ring-1 focus:ring-black">
                            <SelectValue placeholder="Tip Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t} className="focus:bg-neutral-100 text-sm">
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-medium text-neutral-600 ml-1">Asset Rolü</label>
                    <Select value={assetRole} onValueChange={(val) => setAssetRole(val as AssetRole)}>
                        <SelectTrigger className="bg-white border-neutral-200/70 shadow-sm focus:ring-1 focus:ring-black">
                            <SelectValue placeholder="Rol Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r} className="focus:bg-neutral-100 text-sm">
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 lg:col-span-2 flex flex-col">
                    <label className="text-xs font-medium text-neutral-600 ml-1">Dosya Seçimi</label>
                    <div className="flex gap-2">
                        <Input
                            type="file"
                            className="bg-white border-neutral-200/70 shadow-sm file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-100 cursor-pointer transition-colors"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                        <Button
                            onClick={handleUploadClick}
                            disabled={uploadMutation.isPending || !file}
                            className="whitespace-nowrap shadow-sm min-w-[100px] gap-2 transition-all"
                        >
                            {uploadMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                                </>
                            ) : (
                                "Yükle"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {status === "success" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="flex items-center gap-2 text-sm text-green-700 bg-green-50/80 px-4 py-3 rounded-lg border border-green-100"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Dosya başarıyla yüklendi ve eklendi.</span>
                    </motion.div>
                )}
                {status === "error" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="flex items-center gap-2 text-sm text-red-700 bg-red-50/80 px-4 py-3 rounded-lg border border-red-100"
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Yükleme sırasında bir hata oluştu.</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}