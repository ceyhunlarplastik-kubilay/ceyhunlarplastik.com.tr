"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

import { getProduct } from "@/features/admin/products/api/getProduct"
import { ProductVariantsTable } from "@/features/admin/productVariants/components/ProductVariantsTable"
import { CreateVariantDialog } from "@/features/admin/productVariants/components/CreateVariantDialog"

import { useProductVariants } from "@/features/admin/productVariants/hooks/useProductVariants"
import { useVariantReferences } from "@/features/admin/productVariants/hooks/useVariantReferences"
import { useDeleteProductVariant } from "@/features/admin/productVariants/hooks/useDeleteProductVariant"

import type { ProductVariant } from "@/features/admin/productVariants/api/types"

type Props = {
    productId: string
}

export function ProductVariantsManager({ productId }: Props) {
    const [search, setSearch] = useState("")
    const [createOpen, setCreateOpen] = useState(false)
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const {
        data: product,
        isLoading: productLoading,
        isError: productError,
    } = useQuery({
        queryKey: ["admin-product", productId],
        queryFn: () => getProduct({ id: productId }),
        enabled: Boolean(productId),
    })

    const {
        data: variants,
        isLoading: variantsLoading,
        isError: variantsError,
    } = useProductVariants(productId)

    const {
        data: references,
        isLoading: referencesLoading,
        isError: referencesError,
    } = useVariantReferences()

    const deleteMutation = useDeleteProductVariant(productId)

    const filteredVariants = useMemo(() => {
        const list = variants ?? []
        const q = search.trim().toLowerCase()

        if (!q) return list

        return list.filter((variant) => {
            return (
                variant.name.toLowerCase().includes(q) ||
                variant.fullCode.toLowerCase().includes(q)
            )
        })
    }, [search, variants])

    async function handleDelete(variant: ProductVariant) {
        const ok = window.confirm(`"${variant.name}" varyantını kalıcı olarak silmek istediğinize emin misiniz?`)

        if (!ok) return

        setDeletingId(variant.id)

        try {
            await deleteMutation.mutateAsync({ id: variant.id })
        } finally {
            setDeletingId(null)
        }
    }

    if (productLoading || variantsLoading || referencesLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (productError || variantsError || referencesError || !product || !references) {
        return (
            <div className="p-6 text-sm text-red-500">
                Varyant yönetim ekranı yüklenemedi.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-neutral-500 hover:text-black"
                        >
                            <Link href="/admin/products">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Ürünler
                            </Link>
                        </Button>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        {product.name}
                    </h1>

                    <p className="text-neutral-500 text-sm mt-1">
                        Kod: <span className="font-mono text-neutral-700">{product.code}</span> · {(variants ?? []).length} varyant
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Varyant ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white border-neutral-200/60 shadow-sm transition-all focus:ring-1 focus:ring-black"
                        />
                    </div>

                    <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Yeni Varyant
                    </Button>
                </div>
            </div>

            <ProductVariantsTable
                variants={filteredVariants}
                deletingId={deletingId}
                onEdit={(variant) => setEditingVariant(variant)}
                onDelete={handleDelete}
            />

            <CreateVariantDialog
                mode="create"
                open={createOpen}
                onOpenChange={setCreateOpen}
                productId={product.id}
                productCode={product.code}
                references={references}
            />

            {editingVariant && (
                <CreateVariantDialog
                    mode="edit"
                    open
                    variant={editingVariant}
                    onOpenChange={(open) => {
                        if (!open) setEditingVariant(null)
                    }}
                    productId={product.id}
                    productCode={product.code}
                    references={references}
                />
            )}
        </div>
    )
}
