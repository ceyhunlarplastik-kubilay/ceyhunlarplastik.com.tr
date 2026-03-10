"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { Product } from "@/features/public/products/types";
import type { ProductVariant } from "@/features/admin/productVariants/server/getProductVariants";
import type { VariantReferences } from "@/features/admin/productVariants/server/getVariantReferences";
import { ProductVariantsTable } from "@/features/admin/productVariants/components/ProductVariantsTable";
import { CreateVariantDialog } from "@/features/admin/productVariants/components/CreateVariantDialog";

interface Props {
    product: Product;
    initialVariants: ProductVariant[];
    references: VariantReferences;
}

export function ProductVariantsManager({ product, initialVariants, references }: Props) {
    const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
    const [createOpen, setCreateOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = variants.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.fullCode.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-neutral-500 hover:text-black">
                            <Link href="/admin/products">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Ürünler
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{product.name}</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Kod: <span className="font-mono text-neutral-700">{product.code}</span> · {variants.length} varyant
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Varyant ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 bg-white border-neutral-200/60 shadow-sm transition-all focus:ring-1 focus:ring-black"
                        />
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Yeni Varyant
                    </Button>
                </div>
            </div>

            {/* Variants Table */}
            <ProductVariantsTable
                variants={filtered}
                onDelete={(id) => setVariants(prev => prev.filter(v => v.id !== id))}
            />

            {/* Create Dialog */}
            <CreateVariantDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                productId={product.id}
                references={references}
                onCreated={(newVariant) => {
                    setVariants(prev => [newVariant, ...prev]);
                    setCreateOpen(false);
                }}
            />
        </div>
    );
}
