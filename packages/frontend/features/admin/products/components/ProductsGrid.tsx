"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { CreateProductDialog } from "@/features/admin/products/components/CreateProductDialog"
import { EditProductDialog } from "@/features/admin/products/components/EditProductDialog"
import { ProductsFilters } from "@/features/admin/products/components/ProductsFilters"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"

import { useDeleteProduct } from "@/features/admin/products/hooks/useDeleteProduct"

import {
    Pencil,
    Trash2,
    Image as ImageIcon,
    Film,
    FileText,
    Plus,
    Tag,
    Box,
    Loader2,
    Hash,
    Users,
    CalendarDays,
} from "lucide-react"

import { AnimatePresence, motion } from "motion/react"

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
    onCategoryIdChange: (value: string) => void
    page: number
    onPageChange: (page: number) => void
    limit: number
    onLimitChange: (limit: number) => void
    isFetching?: boolean
    dataUpdatedAt?: number
    onRefresh: () => void
    refreshIntervalSeconds: number
    onRefreshIntervalChange: (seconds: number) => void
    showVariantsLink?: boolean
    /** Varyant ekranının kök yolu — panel bazında değişir. */
    variantsBasePath?: string
    /**
     * Verilirse kartta "Müşteriler" düğmesi çıkar (ürün → müşteri eşleşmesi).
     * Opsiyonel: bu grid veri girişi panelinde de kullanılıyor ve `content_editor`
     * ticari CRM verisi görmemeli.
     */
    onViewCustomers?: (product: Product) => void
    /** Müşteri paneli açık olan ürün — kart vurgusu için. */
    customersProductId?: string
}

const MotionLi = motion.li

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

export function ProductsGrid({
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
    dataUpdatedAt,
    onRefresh,
    refreshIntervalSeconds,
    onRefreshIntervalChange,
    showVariantsLink = true,
    variantsBasePath = "/admin/products",
    onViewCustomers,
    customersProductId,
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
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="gap-2"
                >
                        <Plus className="h-4 w-4" />
                        Yeni Ürün
                </Button>
            </div>

            <ProductsFilters
                categories={categories}
                search={searchQuery}
                categoryId={categoryId ?? ""}
                onSearchChange={onSearchQueryChange}
                onCategoryIdChange={onCategoryIdChange}
            />

            <AdminListRefreshBar
                dataUpdatedAt={dataUpdatedAt}
                isFetching={isFetching}
                onRefresh={onRefresh}
                refreshIntervalSeconds={refreshIntervalSeconds}
                onRefreshIntervalChange={onRefreshIntervalChange}
            />

            {/* GRID */}
            <div className="relative" aria-busy={isFetching}>
                {isFetching && (
                    <div className="absolute -top-2 left-0 h-0.5 w-full animate-pulse rounded-full bg-(--color-brand)" />
                )}

                {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                        <p className="text-sm text-neutral-500">
                            Seçilen filtrelere göre ürün bulunamadı.
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        <AnimatePresence>
                            {products.map(product => {
                                const thumb = pickThumb(product)
                                const counts = countByType(product)

                                const category = categories.find(
                                    c => c.id === product.categoryId
                                )
                                const isDeleting = deletingId === product.id
                                const isCustomersOpen = customersProductId === product.id

                                return (
                                    <MotionLi
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${
                                            isCustomersOpen ? "border-(--color-brand) ring-1 ring-(--color-brand)" : "border-neutral-200"
                                        }`}
                                    >
                                        {/* IMAGE */}
                                        <div className="relative aspect-square w-full border-b border-neutral-100 bg-white p-3">
                                            <Badge
                                                className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
                                            >
                                                <Hash className="h-3 w-3" />
                                                {product.code}
                                            </Badge>

                                            <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                                                {counts.images > 0 && (
                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
                                                        <ImageIcon className="h-3 w-3 text-blue-600" />
                                                    </span>
                                                )}
                                                {counts.videos > 0 && (
                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
                                                        <Film className="h-3 w-3 text-purple-600" />
                                                    </span>
                                                )}
                                                {counts.pdfs > 0 && (
                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
                                                        <FileText className="h-3 w-3 text-orange-600" />
                                                    </span>
                                                )}
                                            </div>

                                            {thumb ? (
                                                <Image
                                                    src={thumb}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Box className="h-8 w-8 text-neutral-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* CONTENT */}
                                        <div className="flex flex-1 flex-col gap-2 p-3">
                                            <div>
                                                <p className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-900">
                                                    {product.name}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-neutral-500">
                                                    /{product.slug}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {category ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                                                        <Tag className="h-3 w-3" />
                                                        {category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-neutral-400">
                                                        Kategori yok
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {new Date(product.createdAt).toLocaleDateString("tr-TR")}
                                                </span>
                                            </div>

                                            {/* ACTIONS */}
                                            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                                                {onViewCustomers ? (
                                                    <Button
                                                        size="sm"
                                                        variant={isCustomersOpen ? "default" : "outline"}
                                                        className="h-7 gap-1 px-2 text-xs"
                                                        onClick={() => onViewCustomers(product)}
                                                    >
                                                        <Users className="h-3.5 w-3.5" />
                                                        Müşteriler
                                                    </Button>
                                                ) : null}
                                                {showVariantsLink ? (
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-7 gap-1 px-2 text-xs"
                                                    >
                                                        <Link href={`${variantsBasePath}/${product.id}/variants`}>
                                                            Varyantlar
                                                        </Link>
                                                    </Button>
                                                ) : null}
                                                <div className="ms-auto flex items-center gap-0.5">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => setSelectedProduct(product)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => handleDelete(product)}
                                                        disabled={isDeleting}
                                                    >
                                                        {isDeleting
                                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            : <Trash2 className="h-3.5 w-3.5" />
                                                        }
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </MotionLi>
                                )
                            })}
                        </AnimatePresence>
                    </ul>
                )}
            </div>

            <AdminListPagination
                page={meta?.page ?? page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total}
                limit={limit}
                itemLabel="ürün"
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />
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
