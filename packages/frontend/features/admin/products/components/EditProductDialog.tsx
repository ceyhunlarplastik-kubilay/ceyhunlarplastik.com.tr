"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProduct } from "../server/updateProduct";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/features/public/products/types";
import type { Category } from "@/features/public/categories/types";
import { ProductAssetsUploader } from "./ProductAssetsUploader";
import { PrimarySelector } from "./PrimarySelector";
import { ProductImageGallery } from "./ProductImageGallery";
import { motion } from "framer-motion";
import { Calendar, Hash, Tag, Type } from "lucide-react";

type Props = {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onUpdated: (product: Product) => void;
};

export function EditProductDialog({ product: initialProduct, open, onOpenChange, categories, onUpdated }: Props) {
    const [name, setName] = useState(initialProduct.name);
    const [code, setCode] = useState(initialProduct.code);
    const [categoryId, setCategoryId] = useState(initialProduct.categoryId);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!name.trim() || !code.trim() || !categoryId) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        try {
            setSaving(true);
            const updated = await updateProduct(initialProduct.id, {
                name,
                code,
                categoryId,
            });

            if (updated) {
                onUpdated(updated);
            }
        } catch (err) {
            console.error(err);
            alert("Ürün güncellenemedi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 border-neutral-200">
                <div className="bg-white border-b border-neutral-100 p-6 sticky top-0 z-10">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-sm">
                                <Tag size={16} />
                            </span>
                            Ürün Düzenle: {initialProduct.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-neutral-500 pl-10">
                            Ürün bilgilerini güncelleyin, ana görsel belirleyin ve medya galerinizi yönetin.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                        {/* LEFT PANEL - FORM */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="xl:col-span-4 space-y-6"
                        >
                            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm p-6 overflow-hidden relative">
                                <div className="absolute top-0 inset-x-0 h-1 bg-neutral-900" />
                                <h3 className="font-semibold text-lg mb-6 tracking-tight">Temel Bilgiler</h3>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">Kategori</label>
                                        <Select value={categoryId} onValueChange={setCategoryId}>
                                            <SelectTrigger className="h-11 bg-neutral-50/50 transition-colors focus:ring-1">
                                                <SelectValue placeholder="Kategori Seçin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        <span className="font-mono text-xs text-neutral-400 mr-2">{c.code}</span>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">Kod</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Hash className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                className="pl-10 h-11 bg-neutral-50/50 font-mono transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest ml-1">Ürün Adı</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Type className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="pl-10 h-11 bg-neutral-50/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-end">
                                    <Button onClick={handleSave} disabled={saving} className="w-full shadow-sm text-sm h-11">
                                        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                                    </Button>
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>Slug: <b className="font-mono text-neutral-800">{initialProduct.slug}</b></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Eklendi: {new Date(initialProduct.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>

                        </motion.div>

                        {/* RIGHT PANEL - ASSETS */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="xl:col-span-8 space-y-6"
                        >
                            <ProductAssetsUploader
                                product={initialProduct}
                                onUploadSuccess={() => location.reload()}
                            />

                            <div className="space-y-2 mt-8">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                                    <h3 className="text-base font-semibold text-neutral-800">
                                        Ana (Primary) Görsel Seçimi
                                    </h3>
                                    <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md">
                                        Vitrin
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <PrimarySelector
                                        productId={initialProduct.id}
                                        assets={(initialProduct as any).assets}
                                        onChanged={() => location.reload()}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-8">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                                    <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                                        Tüm Medya Galerisi
                                    </h3>
                                    <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md">
                                        {(initialProduct as any).assets?.length || 0} Öge
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <ProductImageGallery
                                        productId={initialProduct.id}
                                        assets={(initialProduct as any).assets}
                                        onChanged={() => location.reload()}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}