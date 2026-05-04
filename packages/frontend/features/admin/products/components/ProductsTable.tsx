"use client"

import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { CreateProductDialog } from "@/features/admin/products/components/CreateProductDialog"
import { EditProductDialog } from "@/features/admin/products/components/EditProductDialog"

import { useDeleteProduct } from "@/features/admin/products/hooks/useDeleteProduct"

import {
    Pencil,
    Trash2,
    Image as ImageIcon,
    Film,
    FileText,
    Plus,
    Search,
    Tag,
    Box,
    Loader2,
    Hash,
} from "lucide-react"

import { motion, AnimatePresence } from "framer-motion"

import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"

type Props = {
    products: Product[]
    meta?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    categories: Category[]
    searchQuery: string
    onSearchQueryChange: (value: string) => void
    categoryId?: string
    onCategoryIdChange: (value?: string) => void
    page: number
    onPageChange: (page: number) => void
    limit: number
    onLimitChange: (limit: number) => void
    isFetching?: boolean
}

const MotionRow = motion(TableRow)

type ProductAssetLite = {
    id?: string
    type?: string
    role?: string
    url?: string
}

function pickThumb(product: Product) {
    const assets = (product.assets ?? []) as ProductAssetLite[]

    const primary = assets.find(
        (a) => a.role === "PRIMARY" && a.type === "IMAGE"
    )

    if (primary?.url) return primary.url

    const anim = assets.find(
        (a) => a.role === "ANIMATION" && a.type === "IMAGE"
    )

    if (anim?.url) return anim.url

    const anyImg = assets.find((a) => a.type === "IMAGE")

    return anyImg?.url ?? null
}

function countByType(product: Product) {
    const assets = (product.assets ?? []) as ProductAssetLite[]

    return {
        images: assets.filter((a) => a.type === "IMAGE").length,
        videos: assets.filter((a) => a.type === "VIDEO").length,
        pdfs: assets.filter((a) => a.type === "PDF").length,
    }
}

export function ProductsTable({
    products,
    meta,
    categories,
    searchQuery,
    onSearchQueryChange,
    categoryId,
    onCategoryIdChange,
    page,
    onPageChange,
    limit,
    onLimitChange,
    isFetching = false,
}: Props) {
    const [createOpen, setCreateOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const deleteMutation = useDeleteProduct()

    async function handleDelete(product: Product) {
        const ok = window.confirm(`"${product.name}" ürününü kalıcı olarak silmek istediğinize emin misiniz?`)

        if (!ok) return
        setDeletingId(product.id)

        try {
            await deleteMutation.mutateAsync({
                id: product.id
            })
        } catch (err) {
            console.error(err)
            alert("Ürün silinemedi.")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        Ürünler
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Sistemdeki tüm ürünleri bu sayfadan yönetebilirsiniz.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Ürün Ara..."
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={categoryId ?? "__all__"}
                        onValueChange={(next) => onCategoryIdChange(next === "__all__" ? undefined : next)}
                    >
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="Kategori filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Tüm Kategoriler</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.code}-{category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Ürün
                    </Button>
                </div>
            </div>
            {/* TABLE */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                {isFetching && (
                    <div className="h-1 w-full animate-pulse bg-[var(--color-brand)]" />
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[140px]">
                                Ürün Kodu
                            </TableHead>
                            <TableHead>
                                Ürün Adı
                            </TableHead>
                            <TableHead className="w-[240px]">
                                Medya
                            </TableHead>
                            <TableHead className="w-[180px]">
                                Kategori
                            </TableHead>
                            <TableHead className="w-[140px]">
                                Eklenme
                            </TableHead>
                            <TableHead className="text-right w-[120px]">
                                İşlemler
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {products.map(product => {
                                const thumb = pickThumb(product)
                                const counts = countByType(product)

                                const category = categories.find(
                                    c => c.id === product.categoryId
                                )
                                const isDeleting = deletingId === product.id

                                return (
                                    <MotionRow
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border-b hover:bg-neutral-50"
                                    >
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-mono text-sm">
                                                <Hash className="w-3.5 h-3.5 text-neutral-400" />
                                                {product.code}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    /{product.slug}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg border overflow-hidden flex items-center justify-center">
                                                    {thumb ? (
                                                        <img
                                                            src={thumb}
                                                            className="h-full w-full object-cover"
                                                            alt={product.name}
                                                        />
                                                    ) : (
                                                        <Box className="h-5 w-5 text-neutral-300" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {counts.images > 0 && (
                                                        <ImageIcon className="w-4 h-4 text-blue-600" />
                                                    )}

                                                    {counts.videos > 0 && (
                                                        <Film className="w-4 h-4 text-purple-600" />
                                                    )}

                                                    {counts.pdfs > 0 && (
                                                        <FileText className="w-4 h-4 text-orange-600" />
                                                    )}

                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {category ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded-full text-xs">
                                                    <Tag className="w-3 h-3" />
                                                    {category.name}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400 text-xs">
                                                    -
                                                </span>

                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-neutral-500">
                                                {new Date(product.createdAt)
                                                    .toLocaleDateString("tr-TR")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    <Link href={`/admin/products/${product.id}/variants`}>
                                                        Varyantlar
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setSelectedProduct(product)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(product)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />
                                                    }
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </MotionRow>
                                )
                            })}
                        </AnimatePresence>
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                    Seçilen filtrelere göre ürün bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-neutral-600">
                    Toplam <span className="font-semibold text-neutral-900">{meta?.total ?? 0}</span> ürün
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={String(limit)}
                        onValueChange={(next) => onLimitChange(Number(next))}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sayfa boyutu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / sayfa</SelectItem>
                            <SelectItem value="20">20 / sayfa</SelectItem>
                            <SelectItem value="50">50 / sayfa</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={(meta?.page ?? page) <= 1}
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                    >
                        Önceki
                    </Button>

                    <span className="px-2 text-sm text-neutral-700">
                        Sayfa {meta?.page ?? page} / {meta?.totalPages ?? 1}
                    </span>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={(meta?.page ?? page) >= (meta?.totalPages ?? 1)}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Sonraki
                    </Button>
                </div>
            </div>
            {/* CREATE */}
            <CreateProductDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                categories={categories}
                onCreated={() => setCreateOpen(false)}
            />

            {/* EDIT */}
            {selectedProduct && (
                <EditProductDialog
                    product={selectedProduct}
                    open={true}
                    onOpenChange={(open) => !open && setSelectedProduct(null)}
                    categories={categories}
                    onUpdated={() => setSelectedProduct(null)}
                />
            )}
        </div>
    )
}
