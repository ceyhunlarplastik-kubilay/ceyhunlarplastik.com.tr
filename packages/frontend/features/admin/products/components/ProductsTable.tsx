"use client";

import Link from "next/link";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateProductDialog } from "./CreateProductDialog";
import { EditProductDialog } from "./EditProductDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "../server/deleteProduct";
import { Pencil, Trash2, Image as ImageIcon, Film, FileText, Plus, Search, Tag, Box, Loader2, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

import type { Product } from "@/features/public/products/types";
import type { Category } from "@/features/public/categories/types";

type Props = {
    initialData: Product[];
    categories: Category[];
};

function pickThumb(product: Product) {
    const assets = (product as any).assets ?? [];
    const primary = assets.find((a: any) => a.role === "PRIMARY" && a.type === "IMAGE");
    if (primary?.url) return primary.url;

    const anim = assets.find((a: any) => a.role === "ANIMATION" && a.type === "IMAGE");
    if (anim?.url) return anim.url;

    const anyImg = assets.find((a: any) => a.type === "IMAGE");
    return anyImg?.url ?? null;
}

function countByType(product: Product) {
    const assets = (product as any).assets ?? [];
    return {
        images: assets.filter((a: any) => a.type === "IMAGE").length,
        videos: assets.filter((a: any) => a.type === "VIDEO").length,
        pdfs: assets.filter((a: any) => a.type === "PDF").length,
        other: assets.filter((a: any) => !["IMAGE", "VIDEO", "PDF"].includes(a.type)).length,
    };
}

export function ProductsTable({ initialData, categories }: Props) {
    const [products, setProducts] = useState<Product[]>(initialData);
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleDelete = async (product: Product) => {
        const ok = window.confirm(
            `"${product.name}" ürününü kalıcı olarak silmek istediğinize emin misiniz?`
        );
        if (!ok) return;

        setDeletingId(product.id);
        try {
            await deleteProduct(product.id);
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
        } catch (err) {
            console.error(err);
            alert("Ürün silinemedi.");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ürünler</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Sistemdeki tüm ürünleri ve dökümanlarını bu sayfadan yönetebilirsiniz.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Ürün Ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-neutral-200/60 shadow-sm transition-all focus:ring-1 focus:ring-black"
                        />
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Yeni Ürün
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[140px] font-semibold text-neutral-700">Ürün Kodu</TableHead>
                            <TableHead className="font-semibold text-neutral-700">Ürün Adı & Link</TableHead>
                            <TableHead className="w-[240px] font-semibold text-neutral-700">Medya Varlıkları</TableHead>
                            <TableHead className="w-[180px] font-semibold text-neutral-700">Bağlı Kategori</TableHead>
                            <TableHead className="w-[140px] font-semibold text-neutral-700">Eklenme</TableHead>
                            <TableHead className="text-right w-[120px] font-semibold text-neutral-700 pr-5">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <AnimatePresence>
                            {filteredProducts.map((product) => {
                                const thumb = pickThumb(product);
                                const counts = countByType(product);
                                const isDeleting = deletingId === product.id;

                                return (
                                    <motion.tr
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="group border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors"
                                    >
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-mono text-sm border border-neutral-200/60">
                                                <Hash className="w-3.5 h-3.5 text-neutral-400" />
                                                {product.code}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-neutral-900 truncate">{product.name}</p>
                                                    <p className="text-xs text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                                                        /{product.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 shrink-0 rounded-lg border border-neutral-200/60 bg-neutral-50 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow transition-all">
                                                    {thumb ? (
                                                        <img src={thumb} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt={product.name} />
                                                    ) : (
                                                        <Box className="h-5 w-5 text-neutral-300" />
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {(counts.images > 0 || counts.videos > 0 || counts.pdfs > 0) ? (
                                                        <>
                                                            {counts.images > 0 && (
                                                                <div className="flex flex-col items-center gap-0.5 px-2 py-1 bg-blue-50/50 border border-blue-100/50 rounded-md text-blue-700" title={`${counts.images} Görsel`}>
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-medium leading-none">{counts.images}</span>
                                                                </div>
                                                            )}
                                                            {counts.videos > 0 && (
                                                                <div className="flex flex-col items-center gap-0.5 px-2 py-1 bg-purple-50/50 border border-purple-100/50 rounded-md text-purple-700" title={`${counts.videos} Video`}>
                                                                    <Film className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-medium leading-none">{counts.videos}</span>
                                                                </div>
                                                            )}
                                                            {counts.pdfs > 0 && (
                                                                <div className="flex flex-col items-center gap-0.5 px-2 py-1 bg-orange-50/50 border border-orange-100/50 rounded-md text-orange-700" title={`${counts.pdfs} PDF`}>
                                                                    <FileText className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-medium leading-none">{counts.pdfs}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 italic">Medya yok</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {categories.find((c) => c.id === product.categoryId) ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium border border-neutral-200/60">
                                                    <Tag className="w-3 h-3 text-neutral-400" />
                                                    {categories.find((c) => c.id === product.categoryId)?.name}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400 text-xs">-</span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <span className="text-xs font-medium text-neutral-500">
                                                {new Date(product.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right pr-4">
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 shadow-none"
                                                >
                                                    <Link href={`/admin/products/${product.id}/variants`}>
                                                        Varyantlar
                                                    </Link>
                                                </Button>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-neutral-500 hover:text-black hover:bg-neutral-100 ml-1"
                                                    onClick={() => setSelectedProduct(product)}
                                                    disabled={isDeleting}
                                                    title="Düzenle"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(product)}
                                                    disabled={isDeleting}
                                                    title="Kalıcı Olarak Sil"
                                                >
                                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>

                        {filteredProducts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-[400px]">
                                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100">
                                            <Box className="w-8 h-8 text-neutral-300" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-900">Ürün Bulunamadı</p>
                                            <p className="text-sm text-neutral-500 mt-1">
                                                {searchQuery ? `"${searchQuery}" aramasına uygun sonuç yok.` : "Sistemde henüz hiç ürün bulunmuyor."}
                                            </p>
                                        </div>
                                        {!searchQuery && (
                                            <Button variant="outline" onClick={() => setCreateOpen(true)} className="mt-2 shadow-sm">
                                                <Plus className="w-4 h-4 mr-2" />
                                                İlk Ürünü Ekle
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateProductDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                categories={categories}
                onCreated={(newProduct) => {
                    setProducts((prev) => [newProduct, ...prev]);
                }}
            />

            {selectedProduct && selectedProduct !== null && (
                <EditProductDialog
                    product={selectedProduct}
                    open={true}
                    onOpenChange={(open) => !open && setSelectedProduct(null)}
                    categories={categories}
                    onUpdated={(updated) => {
                        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                />
            )}
        </div>
    );
}