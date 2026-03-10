"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProduct } from "../server/createProduct";
import type { Category } from "@/features/public/categories/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/features/public/products/types";
import { motion } from "framer-motion";
import { Box, Hash, Type } from "lucide-react";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onCreated: (product: Product) => void;
};

export function CreateProductDialog({ open, onOpenChange, categories, onCreated }: Props) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!name.trim() || !code.trim() || !categoryId) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        try {
            setLoading(true);
            const newProduct = await createProduct({
                code,
                name,
                categoryId,
            });

            if (newProduct) {
                onCreated(newProduct);
                setName("");
                setCode("");
                setCategoryId("");
                onOpenChange(false);
            }
        } catch (err) {
            console.error(err);
            alert("Ürün oluşturulamadı. Lütfen kategori kodunuzla uyuştuğundan emin olun.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
                        <Box className="w-6 h-6 text-neutral-700" />
                    </div>
                    <DialogTitle className="text-xl">Yeni Ürün Ekle</DialogTitle>
                    <DialogDescription>
                        Kategoriye uygun, sistemdeki yeni ürün kaydını girin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                    >
                        <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider ml-1">Kategori</label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-12 bg-neutral-50/50 hover:bg-neutral-50 transition-colors border-neutral-200">
                                <SelectValue placeholder="Bir kategori seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <span className="font-mono text-xs text-neutral-500 mr-2">{c.code}</span>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                    >
                        <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider ml-1">Ürün Kodu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-4 w-4 text-neutral-400" />
                            </div>
                            <Input
                                placeholder="Örn: 1.01.05"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="pl-10 h-12 bg-neutral-50/50 focus:bg-white transition-colors border-neutral-200 font-mono"
                            />
                        </div>
                        <p className="text-[10px] text-neutral-400 ml-1">
                            Örn: Seçtiğiniz kategori kodu 1.01 ise ürün kodu 1.01 ile başlamalıdır.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                    >
                        <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider ml-1">Ürün Adı</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Type className="h-4 w-4 text-neutral-400" />
                            </div>
                            <Input
                                placeholder="Ürün İsmi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 h-12 bg-neutral-50/50 focus:bg-white transition-colors border-neutral-200"
                            />
                        </div>
                    </motion.div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="px-6 text-neutral-500 hover:text-black">
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="px-8 shadow-sm">
                        {loading ? "Kaydediliyor..." : "Oluştur"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}