"use client";

import { useState } from "react";
import { Trash2, Loader2, Box, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { adminApiClient } from "@/lib/http/client";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductVariant } from "@/features/admin/productVariants/server/getProductVariants";

interface Props {
    variants: ProductVariant[];
    onDelete: (id: string) => void;
}

export function ProductVariantsTable({ variants, onDelete }: Props) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (variant: ProductVariant) => {
        const ok = window.confirm(`"${variant.name}" varyantını kalıcı olarak silmek istediğinize emin misiniz?`);
        if (!ok) return;

        setDeletingId(variant.id);
        try {
            await adminApiClient.delete(`/product-variants/${variant.id}`);
            onDelete(variant.id);
        } catch {
            alert("Varyant silinemedi.");
        } finally {
            setDeletingId(null);
        }
    };

    if (!variants.length) {
        return (
            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                        <Box className="w-7 h-7 text-neutral-300" />
                    </div>
                    <p className="font-medium text-neutral-900">Varyant bulunamadı</p>
                    <p className="text-sm text-neutral-500">Henüz bu ürüne ait varyant eklenmemiş.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-neutral-50/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-neutral-700 w-[220px]">Kod / Ad</TableHead>
                        <TableHead className="font-semibold text-neutral-700">Ölçüler</TableHead>
                        <TableHead className="font-semibold text-neutral-700 w-[140px]">Renk</TableHead>
                        <TableHead className="font-semibold text-neutral-700">Materyaller</TableHead>
                        <TableHead className="font-semibold text-neutral-700">Tedarikçiler</TableHead>
                        <TableHead className="text-right font-semibold text-neutral-700 pr-5 w-[80px]">İşlem</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <AnimatePresence>
                        {variants.map((variant) => (
                            <motion.tr
                                key={variant.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="group border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors"
                            >
                                {/* Code / Name */}
                                <TableCell>
                                    <p className="font-mono text-xs text-neutral-500">{variant.fullCode}</p>
                                    <p className="font-semibold text-neutral-900 text-sm mt-0.5">{variant.name}</p>
                                </TableCell>

                                {/* Measurements */}
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variant.measurements.length === 0 ? (
                                            <span className="text-xs text-neutral-400 italic">–</span>
                                        ) : (
                                            variant.measurements
                                                .sort((a, b) => (a.measurementType.code < b.measurementType.code ? -1 : 1))
                                                .map(m => (
                                                    <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
                                                        {m.measurementType.code}: {m.value}
                                                    </span>
                                                ))
                                        )}
                                    </div>
                                </TableCell>

                                {/* Color */}
                                <TableCell>
                                    {variant.color ? (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full border border-neutral-200 shrink-0"
                                                style={{ backgroundColor: variant.color.hex }}
                                                title={`${variant.color.system} ${variant.color.code} - ${variant.color.name}`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm text-neutral-700 leading-none">
                                                    {variant.color.name}
                                                </p>
                                                <p className="text-[11px] text-neutral-400 mt-1 leading-none">
                                                    {variant.color.system} {variant.color.code}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-400 italic">–</span>
                                    )}
                                </TableCell>

                                {/* Materials */}
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variant.materials.length === 0 ? (
                                            <span className="text-xs text-neutral-400 italic">–</span>
                                        ) : (
                                            variant.materials.map(m => (
                                                <Badge key={m.id} variant="secondary" className="text-xs">{m.name}</Badge>
                                            ))
                                        )}
                                    </div>
                                </TableCell>

                                {/* Suppliers */}
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variant.variantSuppliers.length === 0 ? (
                                            <span className="text-xs text-neutral-400 italic">–</span>
                                        ) : (
                                            variant.variantSuppliers.map(vs => (
                                                <span key={vs.id} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${vs.isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-neutral-100 border-neutral-200 text-neutral-600"}`}>
                                                    {vs.supplier.name}
                                                    {vs.isActive && <span className="ml-1 text-[10px]">✓</span>}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right pr-4">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(variant)}
                                        disabled={deletingId === variant.id}
                                    >
                                        {deletingId === variant.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TableCell>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </TableBody>
            </Table>
        </div>
    );
}
