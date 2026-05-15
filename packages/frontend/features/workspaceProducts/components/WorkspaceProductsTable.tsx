"use client"

import Image from "next/image"
import { AnimatePresence, motion } from "motion/react"
import { Box, Film, Hash, Image as ImageIcon, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ProductsFilters } from "@/features/admin/products/components/ProductsFilters"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import type { Category } from "@/features/public/categories/types"

type AssetLite = {
    id?: string
    type?: string
    role?: string
    url?: string
}

export type WorkspaceProductRow = {
    id: string
    code: string
    name: string
    slug: string
    categoryId: string
    createdAt: string
    updatedAt: string
    category?: {
        id: string
        code?: number
        name: string
        slug?: string
    }
    assets?: AssetLite[]
}

type Props = {
    title: string
    description: string
    emptyMessage: string
    products: WorkspaceProductRow[]
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
    selectedProductId?: string
    onViewVariants: (productId: string) => void
}

const MotionRow = motion(TableRow)

function pickThumb(product: WorkspaceProductRow) {
    const assets = product.assets ?? []
    const primary = assets.find((asset) => asset.role === "PRIMARY" && (asset.type === "IMAGE" || asset.type === undefined))
    if (primary?.url) return primary.url

    const animation = assets.find((asset) => asset.role === "ANIMATION" && (asset.type === "IMAGE" || asset.type === undefined))
    if (animation?.url) return animation.url

    return assets.find((asset) => asset.url)?.url ?? null
}

function countByType(product: WorkspaceProductRow) {
    const assets = product.assets ?? []

    return {
        images: assets.filter((asset) => asset.type === "IMAGE" || asset.type === undefined).length,
        videos: assets.filter((asset) => asset.type === "VIDEO").length,
    }
}

export function WorkspaceProductsTable({
    title,
    description,
    emptyMessage,
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
    selectedProductId,
    onViewVariants,
}: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
                <p className="mt-1 text-sm text-neutral-500">{description}</p>
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

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                {isFetching ? <div className="h-1 w-full animate-pulse bg-[var(--color-brand)]" /> : null}

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[140px]">Ürün Kodu</TableHead>
                            <TableHead>Ürün Adı</TableHead>
                            <TableHead className="w-[240px]">Medya</TableHead>
                            <TableHead className="w-[180px]">Kategori</TableHead>
                            <TableHead className="w-[140px]">Eklenme</TableHead>
                            <TableHead className="w-[120px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {products.map((product) => {
                                const thumb = pickThumb(product)
                                const counts = countByType(product)
                                const category = product.category ?? categories.find((item) => item.id === product.categoryId)
                                const isSelected = selectedProductId === product.id

                                return (
                                    <MotionRow
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={isSelected ? "border-b bg-brand/5" : "border-b hover:bg-neutral-50"}
                                    >
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 font-mono text-sm text-neutral-700">
                                                <Hash className="h-3.5 w-3.5 text-neutral-400" />
                                                {product.code}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-xs text-neutral-500">/{product.slug}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border">
                                                    {thumb ? (
                                                        <Image
                                                            src={thumb}
                                                            className="h-full w-full object-cover"
                                                            alt={product.name}
                                                            width={48}
                                                            height={48}
                                                        />
                                                    ) : (
                                                        <Box className="h-5 w-5 text-neutral-300" />
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {counts.images > 0 ? <ImageIcon className="h-4 w-4 text-blue-600" /> : null}
                                                    {counts.videos > 0 ? <Film className="h-4 w-4 text-purple-600" /> : null}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {category ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs">
                                                    <Tag className="h-3 w-3" />
                                                    {category.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-neutral-500">
                                                {new Date(product.createdAt).toLocaleDateString("tr-TR")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={isSelected ? "default" : "secondary"}
                                                onClick={() => onViewVariants(product.id)}
                                            >
                                                {isSelected ? "Seçili" : "Varyantlar"}
                                            </Button>
                                        </TableCell>
                                    </MotionRow>
                                )
                            })}
                        </AnimatePresence>

                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
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
        </div>
    )
}
